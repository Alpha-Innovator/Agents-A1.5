#!/usr/bin/env python3
"""
Analysis of Binary Black Hole Waveform Errors from SXS Simulations

This script analyzes synthetic waveform difference data representing numerical
errors in the SXS (Simulating eXtreme Spacetimes) binary black hole simulation
catalog. We examine three aspects of numerical accuracy:

1. Total waveform difference between highest resolutions (fig6_data.csv)
2. Mode-decomposed differences by spherical harmonic index ℓ (fig7_data.csv)
3. Extrapolation order convergence (N=2 vs N=3, N=2 vs N=4) (fig8_data.csv)

Author: Research Analysis
Date: 2026-09-17
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.optimize import minimize_scalar
import warnings
warnings.filterwarnings('ignore')

# Set style for publication-quality figures
sns.set_style("whitegrid")
sns.set_context("paper", font_scale=1.2)
plt.rcParams['font.family'] = 'serif'
plt.rcParams['axes.linewidth'] = 1.2
plt.rcParams['xtick.major.width'] = 1.2
plt.rcParams['ytick.major.width'] = 1.2
plt.rcParams['figure.dpi'] = 150

# Base directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
IMAGES_DIR = os.path.join(BASE_DIR, 'report', 'images')

# Ensure directories exist
os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)


def load_data():
    """Load all three dataset files."""
    print("Loading data files...")
    
    fig6 = pd.read_csv(os.path.join(DATA_DIR, 'fig6_data.csv'))
    fig7 = pd.read_csv(os.path.join(DATA_DIR, 'fig7_data.csv'))
    fig8 = pd.read_csv(os.path.join(DATA_DIR, 'fig8_data.csv'))
    
    print(f"  fig6_data.csv: {fig6.shape[0]} rows, {fig6.shape[1]} columns")
    print(f"  fig7_data.csv: {fig7.shape[0]} rows, {fig7.shape[1]} columns")
    print(f"  fig8_data.csv: {fig8.shape[0]} rows, {fig8.shape[1]} columns")
    
    return fig6, fig7, fig8


def lognormal_mle(data):
    """
    Fit a log-normal distribution to data using maximum likelihood estimation.
    Returns shape parameter s, scale parameter sigma, and median.
    """
    # For log-normal: ln(x) ~ Normal(mu, sigma)
    log_data = np.log(data)
    mu, sigma = np.mean(log_data), np.std(log_data)
    median = np.exp(mu)
    return {
        'mu': mu,
        'sigma': sigma,
        'median': median,
        'mean': np.exp(mu + 0.5 * sigma**2),
        'std': np.sqrt((np.exp(sigma**2) - 1) * np.exp(2*mu + sigma**2))
    }


def compute_statistics(data_array, name):
    """Compute comprehensive statistics for a dataset."""
    sorted_data = np.sort(data_array)
    n = len(data_array)
    
    # Basic statistics
    stats_dict = {
        'name': name,
        'count': int(n),
        'mean': float(np.mean(data_array)),
        'std': float(np.std(data_array)),
        'median': float(np.median(data_array)),
        'min': float(np.min(data_array)),
        'max': float(np.max(data_array)),
        'p25': float(np.percentile(data_array, 25)),
        'p75': float(np.percentile(data_array, 75)),
        'p90': float(np.percentile(data_array, 90)),
        'p95': float(np.percentile(data_array, 95)),
        'p99': float(np.percentile(data_array, 99)),
        'iqr': float(np.percentile(data_array, 75) - np.percentile(data_array, 25)),
    }
    
    # Log-normal fit
    ln_fit = lognormal_mle(data_array)
    stats_dict['lognormal'] = {
        'mu': ln_fit['mu'],
        'sigma': ln_fit['sigma'],
        'median': ln_fit['median'],
        'mean': ln_fit['mean'],
        'std': ln_fit['std']
    }
    
    # Fraction below thresholds
    for threshold in [1e-4, 1e-3, 1e-2, 0.1]:
        key = f'frac_below_{threshold}'
        stats_dict[key] = float(np.sum(data_array < threshold) / n)
    
    # Kolmogorov-Smirnov test against log-normal
    ks_stat, ks_pvalue = stats.kstest(data_array, 'lognorm', 
                                       args=(ln_fit['sigma'], 0, np.exp(ln_fit['mu'])))
    stats_dict['ks_test'] = {
        'statistic': float(ks_stat),
        'p_value': float(ks_pvalue)
    }
    
    return stats_dict


def plot_resolution_error_distribution(fig6, stats_out):
    """Figure 1: Distribution of total waveform differences (resolution error)."""
    print("Creating Figure 1: Resolution error distribution...")
    
    data = fig6['waveform_difference'].values
    sorted_data = np.sort(data)
    n = len(data)
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Left panel: Histogram with log-normal fit
    ax = axes[0]
    bins = np.logspace(np.log10(data.min()), np.log10(data.max()), 40)
    ax.hist(data, bins=bins, density=True, alpha=0.7, color='steelblue', 
            edgecolor='black', linewidth=0.5, label='Simulation data')
    
    # Log-normal PDF
    ln_params = lognormal_mle(data)
    x = np.logspace(np.log10(data.min()), np.log10(data.max()), 200)
    y = stats.lognorm.pdf(x, ln_params['sigma'], scale=np.exp(ln_params['mu']))
    ax.plot(x, y, 'r-', linewidth=2, label=f'Log-normal fit (med={ln_params["median"]:.2e})')
    
    ax.set_xlabel('Waveform Difference (dimensionless)', fontsize=12)
    ax.set_ylabel('Probability Density', fontsize=12)
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_title('(a) Resolution Error Distribution', fontsize=13, fontweight='bold')
    ax.legend(loc='upper right', fontsize=10)
    ax.grid(True, alpha=0.3)
    
    # Right panel: Cumulative distribution
    ax = axes[1]
    # Empirical CDF
    ecdf = np.arange(1, n + 1) / n
    ax.scatter(sorted_data, ecdf, s=10, alpha=0.5, color='steelblue', label='Empirical CDF')
    
    # Theoretical CDF from log-normal fit
    x_cdf = np.logspace(np.log10(data.min()), np.log10(data.max()), 200)
    y_cdf = stats.lognorm.cdf(x_cdf, ln_params['sigma'], scale=np.exp(ln_params['mu']))
    ax.plot(x_cdf, y_cdf, 'r-', linewidth=2, label='Log-normal CDF')
    
    # Mark key percentiles
    for pct, color in [(50, 'green'), (90, 'orange'), (95, 'red')]:
        val = np.percentile(data, pct)
        ax.axhline(y=pct/100, color=color, linestyle='--', alpha=0.7)
        ax.axvline(x=val, color=color, linestyle='--', alpha=0.7)
        ax.annotate(f'{pct}th: {val:.2e}', xy=(val, pct/100), 
                   textcoords="offset points", xytext=(10, 5), fontsize=9)
    
    ax.set_xlabel('Waveform Difference (dimensionless)', fontsize=12)
    ax.set_ylabel('Cumulative Probability', fontsize=12)
    ax.set_xscale('log')
    ax.set_title('(b) Cumulative Distribution Function', fontsize=13, fontweight='bold')
    ax.legend(loc='lower right', fontsize=10)
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, 'fig1_resolution_error.png'), 
                bbox_inches='tight', dpi=150)
    plt.close()
    
    return ln_params


def plot_mode_error_comparison(fig7, stats_out):
    """Figure 2: Mode-dependent waveform error by spherical harmonic index ℓ."""
    print("Creating Figure 2: Mode error comparison...")
    
    mode_cols = ['ell2', 'ell3', 'ell4', 'ell5', 'ell6', 'ell7', 'ell8']
    modes = [2, 3, 4, 5, 6, 7, 8]
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Left panel: Box plot by mode
    ax = axes[0]
    data_by_mode = [fig7[col].values for col in mode_cols]
    
    bp = ax.boxplot(data_by_mode, patch_artist=True, showfliers=False)
    colors = plt.cm.viridis(np.linspace(0.2, 0.9, len(modes)))
    for patch, color in zip(bp['boxes'], colors):
        patch.set_facecolor(color)
    
    ax.set_xticks(range(1, len(modes) + 1))
    ax.set_xticklabels([f'ℓ={m}' for m in modes], fontsize=11)
    ax.set_ylabel('Waveform Difference (dimensionless)', fontsize=12)
    ax.set_yscale('log')
    ax.set_title('(a) Error Distribution by Spherical Harmonic Mode', fontsize=13, fontweight='bold')
    ax.grid(True, alpha=0.3, which='both')
    
    # Add median labels
    medians = [np.median(d) for d in data_by_mode]
    for i, med in enumerate(medians):
        ax.text(i + 1, med * 1.35, f'{med:.1e}', ha='center', fontsize=8, 
               fontweight='bold', color='white', bbox=dict(boxstyle='round,pad=0.2', facecolor='black', alpha=0.5))
    
    # Right panel: Violin plot showing distribution shape
    ax = axes[1]
    violin_parts = ax.violinplot(data_by_mode, showmeans=False, showextrema=True)
    
    for i, (violin, color) in enumerate(zip(violin_parts['bodies'], colors)):
        violin.set_facecolor(color)
        violin.set_alpha(0.6)
    
    ax.set_xticks(range(1, len(modes) + 1))
    ax.set_xticklabels([f'ℓ={m}' for m in modes], fontsize=11)
    ax.set_ylabel('Waveform Difference (dimensionless)', fontsize=12)
    ax.set_yscale('log')
    ax.set_title('(b) Mode-Resolved Error Densities', fontsize=13, fontweight='bold')
    ax.grid(True, alpha=0.3, which='both')
    
    # Trend line: median vs ℓ
    log_meds = np.log10(medians)
    coeffs = np.polyfit(modes, log_meds, 1)
    trend_x = np.array(modes)
    trend_y = np.exp(np.polyval(coeffs, trend_x))
    ax.plot(trend_x, trend_y, 'k--', linewidth=2, alpha=0.8, 
            label=f'Trend: $10^{{{coeffs[1]:.2f}}}$')
    ax.legend(fontsize=10)
    
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, 'fig2_mode_error.png'), 
                bbox_inches='tight', dpi=150)
    plt.close()
    
    return medians, modes


def plot_extrapolation_convergence(fig8, stats_out):
    """Figure 3: Extrapolation order convergence comparison."""
    print("Creating Figure 3: Extrapolation convergence...")
    
    col_n2n3 = 'N2vsN3'
    col_n2n4 = 'N2vsN4'
    
    data_n2n3 = fig8[col_n2n3].values
    data_n2n4 = fig8[col_n2n4].values
    
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    # Left panel: Overlapping histograms
    ax = axes[0]
    bins = np.logspace(np.log10(min(data_n2n3.min(), data_n2n4.min())), 
                       np.log10(max(data_n2n3.max(), data_n2n4.max())), 35)
    
    ax.hist(data_n2n3, bins=bins, density=True, alpha=0.6, color='steelblue', 
            edgecolor='black', linewidth=0.5, label='N=2 vs N=3')
    ax.hist(data_n2n4, bins=bins, density=True, alpha=0.6, color='coral', 
            edgecolor='black', linewidth=0.5, label='N=2 vs N=4')
    
    # Log-normal fits
    fit_n2n3 = lognormal_mle(data_n2n3)
    fit_n2n4 = lognormal_mle(data_n2n4)
    
    x = np.logspace(np.log10(data_n2n3.min()), np.log10(data_n2n3.max()), 200)
    ax.plot(x, stats.lognorm.pdf(x, fit_n2n3['sigma'], scale=np.exp(fit_n2n3['mu'])), 
            'b-', linewidth=2, label=f'N2-N3 fit (med={fit_n2n3["median"]:.1e})')
    ax.plot(x, stats.lognorm.pdf(x, fit_n2n4['sigma'], scale=np.exp(fit_n2n4['mu'])), 
            'r-', linewidth=2, label=f'N2-N4 fit (med={fit_n2n4["median"]:.1e})')
    
    ax.set_xlabel('Waveform Difference (dimensionless)', fontsize=12)
    ax.set_ylabel('Probability Density', fontsize=12)
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_title('(a) Extrapolation Order Comparison', fontsize=13, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)
    
    # Right panel: Scatter plot with density
    ax = axes[1]
    # Use hexbin for density visualization
    h = ax.hexbin(data_n2n3, data_n2n4, gridsize=30, cmap='YlOrRd', mincnt=1)
    ax.plot([data_n2n3.min(), data_n2n3.max()], [data_n2n3.min(), data_n2n3.max()], 
            'k--', alpha=0.5, linewidth=1.5, label='N2-N3 = N2-N4')
    
    # Mark medians
    ax.axvline(x=np.median(data_n2n3), color='blue', linestyle=':', alpha=0.7)
    ax.axhline(y=np.median(data_n2n4), color='red', linestyle=':', alpha=0.7)
    
    ax.set_xlabel('N=2 vs N=3 Difference', fontsize=12)
    ax.set_ylabel('N=2 vs N=4 Difference', fontsize=12)
    ax.set_xscale('log')
    ax.set_yscale('log')
    ax.set_title('(b) Joint Distribution of Extrapolation Errors', fontsize=13, fontweight='bold')
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)
    
    cbar = plt.colorbar(h, ax=ax)
    cbar.set_label('Count', fontsize=11)
    
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, 'fig3_extrapolation.png'), 
                bbox_inches='tight', dpi=150)
    plt.close()
    
    return fit_n2n3, fit_n2n4


def plot_correlation_analysis(fig6, fig7, fig8):
    """Figure 4: Correlation between total error and individual modes."""
    print("Creating Figure 4: Correlation analysis...")
    
    mode_cols = ['ell2', 'ell3', 'ell4', 'ell5', 'ell6', 'ell7', 'ell8']
    total_err = fig6['waveform_difference'].values
    
    # Use 2x4 grid: first 7 panels for scatter plots, last panel for summary
    fig, axes = plt.subplots(2, 4, figsize=(16, 8))
    axes = axes.flatten()
    
    correlations = []
    
    for idx, col in enumerate(mode_cols):
        ax = axes[idx]
        mode_err = fig7[col].values
        
        # Compute Pearson correlation
        corr_coef, corr_pval = stats.pearsonr(total_err, mode_err)
        correlations.append(float(corr_coef))
        
        # Scatter plot (subsampled for visibility)
        np.random.seed(42)
        n_plot = min(200, len(total_err))
        indices = np.random.choice(len(total_err), size=n_plot, replace=False)
        
        ax.scatter(total_err[indices], mode_err[indices], 
                  alpha=0.3, s=10, color='steelblue', edgecolors='none')
        
        # Linear fit on log-log scale
        log_x = np.log10(total_err)
        log_y = np.log10(mode_err)
        slope, intercept = np.polyfit(log_x, log_y, 1)
        x_min, x_max = np.log10(total_err.min()), np.log10(total_err.max())
        y_fit = slope * np.array([x_min, x_max]) + intercept
        ax.plot(10**x_min, 10**y_fit[0], 'r--', linewidth=1.5)
        ax.plot(10**x_max, 10**y_fit[1], 'r--', linewidth=1.5)
        
        ax.set_xlabel('Total Difference', fontsize=9)
        ax.set_ylabel(f'\u2113={idx+2} Difference', fontsize=9)
        ax.set_xscale('log')
        ax.set_yscale('log')
        ax.set_title(f'\u2113={idx+2} Mode', fontsize=10, fontweight='bold')
        ax.grid(True, alpha=0.2)
        
        # Add correlation value
        ax.text(0.05, 0.95, f'r={corr_coef:.3f}', transform=ax.transAxes, 
               fontsize=8, verticalalignment='top',
               bbox=dict(boxstyle='round,pad=0.2', facecolor='white', alpha=0.7))
    
    # Summary panel in the last subplot
    ax_summary = axes[7]
    modes = list(range(2, 9))
    colors_bar = plt.cm.viridis(np.linspace(0.2, 0.9, 7))
    
    y_pos = np.arange(len(modes))
    bars = ax_summary.barh(y_pos, correlations, color=colors_bar, 
                           edgecolor='black', linewidth=0.3)
    ax_summary.axvline(x=0, color='black', linewidth=0.3)
    ax_summary.set_yticks(y_pos)
    ax_summary.set_yticklabels([f'\u2113={m}' for m in modes], fontsize=9)
    ax_summary.set_xlabel('Pearson r', fontsize=10)
    ax_summary.set_title('Correlation with Total Error', fontsize=10, fontweight='bold')
    ax_summary.grid(True, alpha=0.2, axis='x')
    
    # Set limits for better visualization
    ax_summary.set_xlim(min(correlations)-0.1, max(correlations)+0.1)
    
    # Add value labels
    for i, (bar, corr) in enumerate(zip(bars, correlations)):
        ax_summary.text(corr + 0.01, bar.get_y() + bar.get_height()/2, 
                       f'{corr:.3f}', va='center', fontsize=8)
    
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, 'fig4_correlation.png'), 
                bbox_inches='tight', dpi=100)
    plt.close()
    
    return correlations


def plot_quantile_analysis(fig6, fig7, fig8):
    """Figure 5: Quantile-quantile plots and statistical validation."""
    print("Creating Figure 5: Quantile analysis...")
    
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    
    # Top-left: QQ plot for total errors
    ax = axes[0, 0]
    data = fig6['waveform_difference'].values
    log_data = np.log(data)
    quantiles = np.arange(0.01, 0.99, 0.01)
    theoretical = stats.norm.ppf(quantiles, loc=np.mean(log_data), scale=np.std(log_data))
    empirical = np.percentile(log_data, quantiles * 100)
    ax.scatter(theoretical, empirical, s=20, color='steelblue', alpha=0.7)
    ax.plot([theoretical.min(), theoretical.max()], 
           [theoretical.min(), theoretical.max()], 'r--', linewidth=1.5)
    ax.set_xlabel('Theoretical Quantiles (Normal)', fontsize=11)
    ax.set_ylabel('Empirical Quantiles (log-data)', fontsize=11)
    ax.set_title('QQ Plot: Log-Transformed Errors', fontsize=12, fontweight='bold')
    ax.grid(True, alpha=0.3)
    
    # Top-right: QQ plot for mode ℓ=2
    ax = axes[0, 1]
    data_l2 = fig7['ell2'].values
    log_data_l2 = np.log(data_l2)
    theoretical_l2 = stats.norm.ppf(quantiles, loc=np.mean(log_data_l2), scale=np.std(log_data_l2))
    empirical_l2 = np.percentile(log_data_l2, quantiles * 100)
    ax.scatter(theoretical_l2, empirical_l2, s=20, color='forestgreen', alpha=0.7)
    ax.plot([theoretical_l2.min(), theoretical_l2.max()], 
           [theoretical_l2.min(), theoretical_l2.max()], 'r--', linewidth=1.5)
    ax.set_xlabel('Theoretical Quantiles (Normal)', fontsize=11)
    ax.set_ylabel('Empirical Quantiles (log-data)', fontsize=11)
    ax.set_title('QQ Plot: ℓ=2 Mode Errors', fontsize=12, fontweight='bold')
    ax.grid(True, alpha=0.3)
    
    # Bottom-left: QQ plot for extrapolation N2vsN3
    ax = axes[1, 0]
    data_ext = fig8['N2vsN3'].values
    log_data_ext = np.log(data_ext)
    theoretical_ext = stats.norm.ppf(quantiles, loc=np.mean(log_data_ext), scale=np.std(log_data_ext))
    empirical_ext = np.percentile(log_data_ext, quantiles * 100)
    ax.scatter(theoretical_ext, empirical_ext, s=20, color='coral', alpha=0.7)
    ax.plot([theoretical_ext.min(), theoretical_ext.max()], 
           [theoretical_ext.min(), theoretical_ext.max()], 'r--', linewidth=1.5)
    ax.set_xlabel('Theoretical Quantiles (Normal)', fontsize=11)
    ax.set_ylabel('Empirical Quantiles (log-data)', fontsize=11)
    ax.set_title('QQ Plot: N2-N3 Extrapolation Errors', fontsize=12, fontweight='bold')
    ax.grid(True, alpha=0.3)
    
    # Bottom-right: Error budget breakdown
    ax = axes[1, 1]
    
    # Compute median contributions
    medians_all = [np.median(fig7[col].values) for col in ['ell2', 'ell3', 'ell4', 'ell5', 'ell6', 'ell7', 'ell8']]
    total_median = np.median(fig6['waveform_difference'].values)
    ext_n2n3_median = np.median(fig8['N2vsN3'].values)
    ext_n2n4_median = np.median(fig8['N2vsN4'].values)
    
    categories = ['Resolution\n(ℓ=2-8)\nmedian', 'Extrapolation\nN2-N3\nmedian', 
                  'Extrapolation\nN2-N4\nmedian']
    values = [np.max(medians_all), ext_n2n3_median, ext_n2n4_median]
    colors_bar = ['steelblue', 'forestgreen', 'coral']
    
    bars = ax.bar(categories, values, color=colors_bar, edgecolor='black', linewidth=0.5)
    ax.set_yscale('log')
    ax.set_ylabel('Waveform Difference (dimensionless)', fontsize=11)
    ax.set_title('Typical Error Magnitudes', fontsize=12, fontweight='bold')
    ax.grid(True, alpha=0.3, which='both')
    
    # Add value labels
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() * 1.2, 
               f'{val:.1e}', ha='center', fontsize=9, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, 'fig5_quantile_analysis.png'), 
                bbox_inches='tight', dpi=150)
    plt.close()


def save_intermediate_outputs(fig6, fig7, fig8, stats_dict):
    """Save intermediate analysis outputs."""
    print("Saving intermediate outputs...")
    
    # Save resolution errors
    np.savez(os.path.join(OUTPUTS_DIR, 'resolution_errors.npz'),
             data=fig6['waveform_difference'].values,
             stats=json.dumps(stats_dict['resolution']))
    
    # Save mode errors
    mode_data = fig7[['ell2', 'ell3', 'ell4', 'ell5', 'ell6', 'ell7', 'ell8']].values
    np.savez(os.path.join(OUTPUTS_DIR, 'mode_errors.npz'),
             data=mode_data,
             modes=np.array([2, 3, 4, 5, 6, 7, 8]),
             column_names=np.array(['ell2', 'ell3', 'ell4', 'ell5', 'ell6', 'ell7', 'ell8']),
             stats=json.dumps(stats_dict['modes']))
    
    # Save extrapolation errors
    np.savez(os.path.join(OUTPUTS_DIR, 'extrapolation_errors.npz'),
             n2n3=fig8['N2vsN3'].values,
             n2n4=fig8['N2vsN4'].values,
             stats=json.dumps(stats_dict['extrapolation']))
    
    # Save comprehensive summary
    summary = {
        'analysis_date': '2026-09-17',
        'datasets': {
            'fig6': {'rows': len(fig6), 'column': 'waveform_difference'},
            'fig7': {'rows': len(fig7), 'columns': list(fig7.columns)},
            'fig8': {'rows': len(fig8), 'columns': list(fig8.columns)}
        },
        'key_findings': {
            'resolution_median': stats_dict['resolution']['median'],
            'resolution_frac_below_1e3': stats_dict['resolution']['frac_below_0.001'],
            'mode_error_ratio_l8_l2': stats_dict['modes']['ell8']['median'] / stats_dict['modes']['ell2']['median'],
            'extrapolation_ratio_n2n4_n2n3': stats_dict['extrapolation']['N2vsN4']['median'] / stats_dict['extrapolation']['N2vsN3']['median'],
        },
        'statistics': stats_dict
    }
    
    with open(os.path.join(OUTPUTS_DIR, 'analysis_summary.json'), 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"  Saved: resolution_errors.npz")
    print(f"  Saved: mode_errors.npz")
    print(f"  Saved: extrapolation_errors.npz")
    print(f"  Saved: analysis_summary.json")


def main():
    """Main analysis pipeline."""
    print("=" * 60)
    print("SXS Binary Black Hole Waveform Error Analysis")
    print("=" * 60)
    
    # Load data
    fig6, fig7, fig8 = load_data()
    
    # Compute statistics
    print("\nComputing statistics...")
    stats_dict = {}
    
    # Resolution errors (fig6)
    res_data = fig6['waveform_difference'].values
    stats_dict['resolution'] = compute_statistics(res_data, 'resolution_total')
    print(f"  Resolution error: median={stats_dict['resolution']['median']:.3e}")
    
    # Mode errors (fig7)
    stats_dict['modes'] = {}
    for col in fig7.columns:
        mode_data = fig7[col].values
        stats_dict['modes'][col] = compute_statistics(mode_data, col)
        print(f"  Mode {col}: median={stats_dict['modes'][col]['median']:.3e}")
    
    # Extrapolation errors (fig8)
    stats_dict['extrapolation'] = {}
    for col in fig8.columns:
        ext_data = fig8[col].values
        stats_dict['extrapolation'][col] = compute_statistics(ext_data, col)
        print(f"  {col}: median={stats_dict['extrapolation'][col]['median']:.3e}")
    
    # Generate figures
    print("\nGenerating figures...")
    ln_params = plot_resolution_error_distribution(fig6, stats_dict)
    medians, modes = plot_mode_error_comparison(fig7, stats_dict)
    fit_n2n3, fit_n2n4 = plot_extrapolation_convergence(fig8, stats_dict)
    correlations = plot_correlation_analysis(fig6, fig7, fig8)
    plot_quantile_analysis(fig6, fig7, fig8)
    
    # Save intermediate outputs
    save_intermediate_outputs(fig6, fig7, fig8, stats_dict)
    
    # Print summary
    print("\n" + "=" * 60)
    print("Analysis Complete!")
    print("=" * 60)
    print(f"\nFigures saved to: {IMAGES_DIR}")
    print(f"Outputs saved to: {OUTPUTS_DIR}")
    print("\nKey Results:")
    print(f"  - Resolution error median: {stats_dict['resolution']['median']:.3e}")
    print(f"  - Fraction with error < 10⁻³: {stats_dict['resolution']['frac_below_0.001']:.2%}")
    print(f"  - Mode error ratio (ℓ=8 vs ℓ=2): {medians[-1]/medians[0]:.2f}")
    print(f"  - Extrapolation N2-N4/N2-N3 ratio: {fit_n2n4['median']/fit_n2n3['median']:.2f}")
    
    return stats_dict


if __name__ == '__main__':
    main()
