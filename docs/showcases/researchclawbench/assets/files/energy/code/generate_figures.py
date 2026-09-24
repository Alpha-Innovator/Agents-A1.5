#!/usr/bin/env python3
"""
Visualization module for the African Green Hydrogen Cost Model.

Generates all report figures:
  Fig 1: Data overview - hexagon locations with resource potentials
  Fig 2: Spatial LCOH distribution across African production sites
  Fig 3: Delivered cost breakdown (stacked components) for key sites
  Fig 4: Scenario comparison - delivered costs under financing/policy scenarios
  Fig 5: Interest rate sensitivity - WACC vs delivered cost with EU benchmark
  Fig 6: Africa vs Europe competitiveness comparison
  Fig 7: 2030 technology improvement projections
  Fig 8: Shipping distance vs delivered cost relationship
  Fig 9: Carbon pricing break-even analysis

Author: Research Analysis
Date: 2026-09-17
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from datetime import datetime

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(WORKSPACE, "data")
OUTPUT_DIR = os.path.join(WORKSPACE, "outputs")
IMAGES_DIR = os.path.join(WORKSPACE, "report", "images")

os.makedirs(IMAGES_DIR, exist_ok=True)

# Color palette
COLORS = {
    "pv": "#FDB813",        # solar yellow
    "wind": "#2E86AB",     # wind blue
    "lcoh": "#A23B72",     # purple
    "conversion": "#F18F01",
    "shipping": "#C73E1D",
    "reconversion": "#6A994E",
    "total": "#BC4749",
    "europe": "#1B9E77",
    "africa_base": "#D95F02",
    "africa_derisk": "#7570B3",
    "africa_rising": "#E7298A",
    "competitive": "#6A994E",
    "non_competitive": "#BC4749",
}

plt.rcParams.update({
    'font.size': 11,
    'axes.titlesize': 13,
    'axes.labelsize': 12,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'figure.dpi': 150,
    'savefig.dpi': 150,
    'savefig.bbox': 'tight',
})


def load_outputs():
    """Load all model output files."""
    baseline = pd.read_csv(os.path.join(OUTPUT_DIR, "baseline_results_2025.csv"))
    comparison = pd.read_csv(os.path.join(OUTPUT_DIR, "scenario_comparison.csv"))
    ir_sens = pd.read_csv(os.path.join(OUTPUT_DIR, "interest_rate_sensitivity.csv"))
    
    with open(os.path.join(OUTPUT_DIR, "europe_comparison.json")) as f:
        europe = json.load(f)
    
    scenarios = {}
    for scen in ["base_2025", "derisk_2025", "highrisk_2025", "rising_rates_2025",
                 "base_2030", "derisk_2030"]:
        scenarios[scen] = pd.read_csv(os.path.join(OUTPUT_DIR, f"scenario_results_{scen}.csv"))
    
    return baseline, comparison, ir_sens, europe, scenarios


def get_country_shape():
    """Load African country boundaries from shapefile."""
    try:
        import geopandas as gpd
        shp_path = os.path.join(DATA_DIR, "africa_map", "ne_10m_admin_0_countries.shp")
        gdf = gpd.read_file(shp_path)
        return gdf
    except Exception as e:
        print(f"Warning: could not load shapefile: {e}")
        return None


def fig1_data_overview(baseline):
    """Figure 1: Data overview - hexagon locations with resource potentials and countries."""
    fig, axes = plt.subplots(1, 2, figsize=(16, 7), sharey=True)
    
    countries = get_country_shape()
    
    for idx, (ax, col, title, cmap) in enumerate([
        (axes[0], "theo_pv", "Solar PV Resource Potential", "YlOrRd"),
        (axes[1], "theo_wind", "Wind Resource Potential", "BuPu"),
    ]):
        if countries is not None:
            # Try to identify African countries for the basemap
            try:
                africa_countries = countries[countries["CONTINENT"] == "Africa"]
                africa_countries.plot(ax=ax, color="#E8E8E8", edgecolor="#CCCCCC", linewidth=0.3)
            except Exception:
                countries.plot(ax=ax, color="#E8E8E8", edgecolor="#CCCCCC", linewidth=0.3)

        sc = ax.scatter(baseline["lon"], baseline["lat"], 
                       c=baseline[col], cmap=cmap, s=120, edgecolors="#333", 
                       linewidths=1.5, zorder=5, vmin=0, vmax=1)
        
        ax.set_title(title, fontsize=13, fontweight='bold')
        ax.set_xlabel("Longitude")
        ax.set_ylabel("Latitude")
        ax.set_xlim(10, 26)
        if idx == 0:
            ax.set_ylim(-30, -16)
        plt.colorbar(sc, ax=ax, label="Normalized resource index", shrink=0.8)
        
        # Add legend annotations
        ax.annotate(f'n = {len(baseline)} production sites', 
                   xy=(0.02, 0.98), xycoords='axes fraction',
                   fontsize=10, verticalalignment='top',
                   bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    plt.suptitle("African Green Hydrogen Production Sites — Resource Endowment", 
                fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig01_data_overview.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig01_data_overview.png")


def fig2_lcoh_spatial(baseline):
    """Figure 2: Spatial LCOH distribution across African production sites."""
    fig, axes = plt.subplots(1, 2, figsize=(16, 7))
    
    countries = get_country_shape()
    
    # Left panel: LCOH map
    ax = axes[0]
    if countries is not None:
        try:
            africa_countries = countries[countries["CONTINENT"] == "Africa"]
            africa_countries.plot(ax=ax, color="#E8E8E8", edgecolor="#CCCCCC", linewidth=0.3)
        except Exception:
            pass
    
    sc = ax.scatter(baseline["lon"], baseline["lat"], 
                   c=baseline["lcoh_production"], cmap="RdYlBu_r", 
                   s=150, edgecolors="#333", linewidths=1.5, zorder=5,
                   vmin=baseline["lcoh_production"].min(),
                   vmax=baseline["lcoh_production"].max())
    
    ax.set_title("Levelized Cost of Hydrogen (Production)", fontsize=13, fontweight='bold')
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.set_xlim(10, 26)
    ax.set_ylim(-30, -16)
    plt.colorbar(sc, ax=ax, label="LCOH (EUR/kgH₂)", shrink=0.8)
    
    # Annotate top 5 cheapest sites
    sorted_sites = baseline.sort_values("lcoh_production")
    for _, row in sorted_sites.head(5).iterrows():
        ax.annotate(row["hex_id"], (row["lon"], row["lat"]), 
                   fontsize=8, ha='center', va='bottom', fontweight='bold',
                   bbox=dict(boxstyle='round,pad=0.1', facecolor='white', alpha=0.7))
    
    # Right panel: Technology choice and CF comparison
    ax2 = axes[1]
    tech_colors = ["#FDB813" if t == "pv" else "#2E86AB" for t in baseline["technology"]]
    ax2.scatter(baseline["theo_pv"], baseline["theo_wind"], 
               c=tech_colors, s=150, edgecolors="#333", linewidths=1.5, zorder=5)
    
    # Add decision boundary annotation
    ax2.axvline(x=(0.33-0.16)/0.17, color='gray', linestyle='--', alpha=0.5, linewidth=1)
    ax2.axhline(y=(0.33/1.326-0.10)/0.38, color='gray', linestyle='--', alpha=0.5, linewidth=1)
    
    ax2.set_title("Technology Selection by Resource Profile", fontsize=13, fontweight='bold')
    ax2.set_xlabel("Normalized PV Potential")
    ax2.set_ylabel("Normalized Wind Potential")
    ax2.legend([mpatches.Patch(color='#FDB813'), mpatches.Patch(color='#2E86AB')],
              ["Solar PV optimal", "Wind optimal"], loc='upper right')
    
    # Add LCOE values as text annotations
    for _, row in baseline.iterrows():
        lcoe_text = f"{row['lcoe_chosen']:.1f}"
        ax2.annotate(lcoe_text, (row["theo_pv"], row["theo_wind"]),
                    fontsize=7, ha='center', va='center',
                    bbox=dict(boxstyle='round,pad=0.05', facecolor='white', alpha=0.6))
    
    plt.suptitle("Green Hydrogen Production Cost Geography", fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig02_lcoh_spatial.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig02_lcoh_spatial.png")


def fig3_cost_breakdown(baseline):
    """Figure 3: Delivered cost breakdown for key sites."""
    fig, ax = plt.subplots(figsize=(12, 7))
    
    # Select representative sites: cheapest, median, most expensive
    sorted_by_cost = baseline.sort_values("delivered_cost")
    selected = sorted_by_cost.iloc[[0, len(sorted_by_cost)//2, -1]].copy()
    selected = selected.reset_index(drop=True)
    
    # Cost components for stacked bar
    components = ['lcoh_production', 'nh3_conversion', 'shipping_cost', 'reconversion_cost']
    labels = ['LCOH\n(electrolysis)', 'NH₃ Conversion\n(compression)', 'Marine\nShipping', 'Reconversion\nat EU port']
    colors = [COLORS["lcoh"], COLORS["conversion"], COLORS["shipping"], COLORS["reconversion"]]
    
    x = np.arange(len(selected))
    bottom = np.zeros(len(selected))
    
    for comp, label, color in zip(components, labels, colors):
        values = selected[comp].values
        bars = ax.bar(x, values, bottom=bottom, label=label, color=color, edgecolor='white', linewidth=0.5)
        bottom += values
        
        # Add value labels on segments
        for i, v in enumerate(values):
            if v > 0.15:  # Only label significant segments
                ax.text(i, bottom[i] - v/2, f'€{v:.2f}', ha='center', va='center', 
                       fontsize=9, fontweight='bold', color='white')
    
    ax.set_ylabel("Delivered Cost (EUR/kgH₂)", fontsize=12)
    ax.set_xlabel("Production Site (cheapest → most expensive)", fontsize=12)
    ax.set_xticks(x)
    ax.set_xticklabels([f"{row['hex_id']}\n({row['technology'].upper()}+)" 
                        for _, row in selected.iterrows()], fontsize=10)
    ax.set_title("Cost Breakdown: African Green Hydrogen Delivered to Europe (Base Case 2025)", 
                fontsize=13, fontweight='bold')
    
    # Total labels on top
    for i, row in selected.iterrows():
        ax.text(i, row["delivered_cost"] + 0.05, f"€{row['delivered_cost']:.2f}",
               ha='center', va='bottom', fontsize=11, fontweight='bold')
    
    ax.legend(loc='upper right', framealpha=0.9)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig03_cost_breakdown.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig03_cost_breakdown.png")


def fig4_scenario_comparison(comparison, scenarios):
    """Figure 4: Scenario comparison - delivered costs under different scenarios."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # Left: Grouped bar chart of mean delivered costs
    ax = axes[0]
    scenario_labels = []
    means = []
    mins = []
    p25s = []
    p75s = []
    
    for _, row in comparison.iterrows():
        scenario_labels.append(row["label"])
        means.append(row["mean_delivered"])
        mins.append(row["min_delivered"])
        p25s.append(row["p25_delivered"])
        p75s.append(row["p75_delivered"])
    
    x = np.arange(len(scenario_labels))
    width = 0.5
    
    # Range band (min to p75 for visualization)
    ax.bar(x, [m - mi for m, mi in zip(means, mins)], bottom=mins, 
           width=width, label="Min → Mean", color="#FFB347", alpha=0.8, edgecolor='white')
    ax.bar(x, [p75 - m for m, p75 in zip(means, p75s)], bottom=means,
           width=width, label="Mean → P75", color="#88C999", alpha=0.8, edgecolor='white')
    
    # Points for means
    ax.scatter(x, means, color="#333", s=60, zorder=5, edgecolors='white', linewidths=2)
    
    # Europe benchmark line
    europe_2025 = 5.50
    ax.axhline(y=europe_2025, color="#1B9E77", linestyle='--', linewidth=2, alpha=0.8)
    ax.text(len(scenario_labels)-0.5, europe_2025+0.05, f"Europe 2025\n€{europe_2025:.2f}",
           ha='center', fontsize=9, color="#1B9E77", fontweight='bold',
           bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    ax.set_xticks(x)
    ax.set_xticklabels(scenario_labels, rotation=30, ha='right', fontsize=9)
    ax.set_ylabel("Delivered Cost (EUR/kgH₂)")
    ax.set_title("Scenario Comparison: Delivered Cost Distribution", fontsize=13, fontweight='bold')
    ax.legend(loc='upper left')
    ax.spines['top'].set_visible(False)
    
    # Right: Number of competitive sites per scenario
    ax2 = axes[1]
    sites_below_5 = comparison["sites_below_5"].values
    sites_below_4 = comparison["sites_below_4"].values
    
    bars1 = ax2.bar(x - width/2, sites_below_5, width, label="Below €5/kgH₂", 
                   color="#88C999", edgecolor='white')
    bars2 = ax2.bar(x + width/2, sites_below_4, width, label="Below €4/kgH₂",
                   color="#FFB347", edgecolor='white')
    
    ax2.set_xticks(x)
    ax2.set_xticklabels(scenario_labels, rotation=30, ha='right', fontsize=9)
    ax2.set_ylabel("Number of Competitive Sites (out of 30)")
    ax2.set_title("Sites Below Key Cost Thresholds", fontsize=13, fontweight='bold')
    ax2.legend()
    ax2.spines['top'].set_visible(False)
    
    # Add value labels
    for bar in bars1:
        height = bar.get_height()
        if height > 0:
            ax2.annotate(f'{int(height)}', xy=(bar.get_x() + bar.get_width()/2, height),
                        xytext=(0, 3), textcoords="offset points",
                        ha='center', va='bottom', fontsize=9, fontweight='bold')
    for bar in bars2:
        height = bar.get_height()
        if height > 0:
            ax2.annotate(f'{int(height)}', xy=(bar.get_x() + bar.get_width()/2, height),
                        xytext=(0, 3), textcoords="offset points",
                        ha='center', va='bottom', fontsize=9, fontweight='bold')
    
    plt.suptitle("Financing and Policy Scenarios Impact on Hydrogen Competitiveness", 
                fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig04_scenario_comparison.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig04_scenario_comparison.png")


def fig5_interest_rate_sensitivity(ir_sens, europe):
    """Figure 5: Interest rate sensitivity with EU benchmark."""
    fig, ax = plt.subplots(figsize=(10, 7))
    
    wacc = ir_sens["wacc"].values
    mean_cost = ir_sens["mean_delivered"].values
    min_cost = ir_sens["min_delivered"].values
    europe_2025 = europe["europe_lcoh_2025"]
    europe_2030 = europe["europe_lcoh_2030"]
    
    # Plot bands
    ax.fill_between(wacc * 100, min_cost, mean_cost, alpha=0.3, color="#D95F02",
                   label="Africa: Min → Mean")
    ax.plot(wacc * 100, mean_cost, color="#D95F02", linewidth=2.5, marker='o', 
           markersize=6, label="Africa: Mean")
    ax.plot(wacc * 100, min_cost, color="#6A994E", linewidth=2, marker='s', 
           markersize=6, alpha=0.7, label="Africa: Best site")
    
    # Europe benchmarks
    ax.axhline(y=europe_2025, color="#1B9E77", linestyle='--', linewidth=2, alpha=0.8)
    ax.axhline(y=europe_2030, color="#1B9E77", linestyle=':', linewidth=2, alpha=0.6)
    
    ax.text(16, europe_2025+0.02, f"Europe 2025 (€{europe_2025:.2f})", 
           fontsize=9, color="#1B9E77", fontweight='bold')
    ax.text(16, europe_2030+0.02, f"Europe 2030 (€{europe_2030:.2f})", 
           fontsize=9, color="#1B9E77", fontweight='bold', alpha=0.7)
    
    ax.set_xlabel("Weighted Average Cost of Capital (WACC, %)", fontsize=12)
    ax.set_ylabel("Delivered Cost (EUR/kgH₂)", fontsize=12)
    ax.set_title("Interest Rate Sensitivity: De-risking Impact on Cost Competitiveness", 
                fontsize=13, fontweight='bold')
    ax.legend(loc='lower right', framealpha=0.9)
    ax.grid(True, alpha=0.3)
    ax.spines['top'].set_visible(False)
    
    # Highlight key regions
    ax.axvspan(5, 8, alpha=0.1, color='gray', label='Current African WACC range')
    ax.axvspan(4, 6, alpha=0.15, color='green', label='De-risked (EU-style) WACC')
    
    # Annotation arrows
    ax.annotate('De-risking\nbenefit', xy=(5, 5.09), xytext=(8, 5.6),
               fontsize=10, fontweight='bold', color='#6A994E',
               arrowprops=dict(arrowstyle='->', color='#6A994E', lw=2))
    
    ax.annotate('Rising\nrate penalty', xy=(15, 7.21), xytext=(12, 6.5),
               fontsize=10, fontweight='bold', color='#BC4749',
               arrowprops=dict(arrowstyle='->', color='#BC4749', lw=2))
    
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig05_interest_rate_sensitivity.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig05_interest_rate_sensitivity.png")


def fig6_africa_vs_europe(europe, baseline, scenarios):
    """Figure 6: Africa vs Europe competitiveness comparison."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # Left: Bar chart comparison
    ax = axes[0]
    
    categories = ['Africa\n2025 (mean)', 'Africa\n2025 (best)', 'Africa\n2030 (mean)', 
                  'Africa 2030\n(de-risked)', 'Europe\n2025', 'Europe\n2030']
    values = [
        europe["africa_mean_2025_base"],
        europe["africa_min_2025_base"],
        europe["africa_mean_2030_base"],
        europe["africa_mean_2030_derisk"],
        europe["europe_lcoh_2025"],
        europe["europe_lcoh_2030"],
    ]
    
    colors = ["#D95F02", "#FDB813", "#7570B3", "#1B9E77", "#1B9E77", "#1B9E77"]
    is_europe = [False, False, False, False, True, True]
    
    bars = ax.bar(categories, values, color=colors, edgecolor='white', width=0.6)
    
    # Add value labels
    for bar, val, is_eur in zip(bars, values, is_europe):
        height = bar.get_height()
        label = f"€{val:.2f}"
        va = 'bottom' if not is_eur else 'bottom'
        ax.annotate(label, xy=(bar.get_x() + bar.get_width()/2, height),
                   xytext=(0, 5), textcoords="offset points",
                   ha='center', va=va, fontsize=10, fontweight='bold')
    
    ax.set_ylabel("Cost (EUR/kgH₂)")
    ax.set_title("Africa vs Europe: Green Hydrogen Cost Comparison", fontsize=13, fontweight='bold')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Add gap annotations
    for i in range(4):
        gap = values[i] - values[4] if i < 4 else values[i] - values[5]
        if i == 4:
            continue
        y_pos = max(values[i], values[4]) + 0.1
        ax.text(i, y_pos, f"€{gap:+.2f}", ha='center', fontsize=8, 
               color='#BC4749' if gap > 0 else '#6A994E', fontweight='bold')
    
    # Right: Gap evolution
    ax2 = axes[1]
    
    gap_2025 = europe["competitiveness_gap_2025"]
    gap_2030_base = europe["competitiveness_gap_2030_base"]
    gap_2030_derisk = europe["competitiveness_gap_2030_derisk"]
    
    x = np.arange(3)
    width = 0.5
    
    gaps = [gap_2025, gap_2030_base, gap_2030_derisk]
    bar_colors = ["#D95F02" if g > 0 else "#6A994E" for g in gaps]
    
    bars = ax2.bar(x, gaps, width, color=bar_colors, edgecolor='white')
    ax2.axhline(y=0, color='#333', linestyle='-', linewidth=1, alpha=0.5)
    
    ax2.set_xticks(x)
    ax2.set_xticklabels(['2025\n(Base)', '2030\n(Base Tech)', '2030\n(Base + De-risked)'], fontsize=9)
    ax2.set_ylabel("Africa Premium over Europe (EUR/kgH₂)")
    ax2.set_title("Competitiveness Gap Evolution", fontsize=13, fontweight='bold')
    ax2.spines['top'].set_visible(False)
    
    for bar, g in zip(bars, gaps):
        height = bar.get_height()
        label = f"€{g:+.2f}"
        va = 'bottom' if height >= 0 else 'top'
        y_pos = height + 0.05 if height >= 0 else height - 0.05
        ax2.annotate(label, xy=(bar.get_x() + bar.get_width()/2, height),
                    xytext=(0, 5) if height >= 0 else (0, -5),
                    textcoords="offset points", ha='center', va=va,
                    fontsize=10, fontweight='bold',
                    color='#BC4749' if g > 0 else '#6A994E')
    
    plt.suptitle("African Green Hydrogen: Cost Competitiveness vs European Production", 
                fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig06_africa_vs_europe.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig06_africa_vs_europe.png")


def fig7_2030_projection(scenarios, baseline):
    """Figure 7: 2030 technology improvement projections."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    base_2025 = scenarios["base_2025"]
    base_2030 = scenarios["base_2030"]
    derisk_2030 = scenarios["derisk_2030"]
    
    # Left: Cost component evolution for median site
    ax = axes[0]
    
    # Get median site from 2025
    median_idx = base_2025["delivered_cost"].median()
    med_site = base_2025.iloc[(base_2025["delivered_cost"] - median_idx).abs().argsort()[0]]
    
    # Extract components for 2025 and 2030 for this site
    components_2025 = [med_site["lcoh_production"], med_site["nh3_conversion"], 
                       med_site["shipping_cost"], med_site["reconversion_cost"]]
    
    # Find same site in 2030
    med_2030 = base_2030[base_2030["hex_id"] == med_site["hex_id"]].iloc[0]
    components_2030 = [med_2030["lcoh_production"], med_2030["nh3_conversion"],
                       med_2030["shipping_cost"], med_2030["reconversion_cost"]]
    
    derisk_2030_site = derisk_2030[derisk_2030["hex_id"] == med_site["hex_id"]].iloc[0]
    components_derisk = [derisk_2030_site["lcoh_production"], derisk_2030_site["nh3_conversion"],
                         derisk_2030_site["shipping_cost"], derisk_2030_site["reconversion_cost"]]
    
    x = np.arange(len(components_2025))
    width = 0.25
    
    labels = ['LCOH\n(electrolysis)', 'NH₃\nConversion', 'Shipping', 'Reconversion']
    colors = [COLORS["lcoh"], COLORS["conversion"], COLORS["shipping"], COLORS["reconversion"]]
    
    ax.bar(x - width, components_2025, width, label="2025 Base", color=[c for c in colors], alpha=0.8)
    ax.bar(x, components_2030, width, label="2030 Base", color=colors, alpha=0.9)
    ax.bar(x + width, components_derisk, width, label="2030 De-risked", 
           color=[COLORS["europe"], COLORS["conversion"], COLORS["shipping"], COLORS["reconversion"]], alpha=0.9)
    
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontsize=9)
    ax.set_ylabel("Cost Component (EUR/kgH₂)")
    ax.set_title(f"Cost Evolution for Median Site ({med_site['hex_id']})", fontsize=13, fontweight='bold')
    ax.legend(framealpha=0.9)
    ax.spines['top'].set_visible(False)
    
    # Right: Distribution shift
    ax2 = axes[1]
    
    ax2.hist(base_2025["delivered_cost"], bins=10, alpha=0.5, label="2025 Base", 
            color="#D95F02", edgecolor='white')
    ax2.hist(base_2030["delivered_cost"], bins=10, alpha=0.5, label="2030 Base",
            color="#7570B3", edgecolor='white')
    ax2.hist(derisk_2030["delivered_cost"], bins=10, alpha=0.5, label="2030 De-risked",
            color="#1B9E77", edgecolor='white')
    
    # Europe lines
    ax2.axvline(x=5.50, color="#1B9E77", linestyle='--', linewidth=1.5, alpha=0.7)
    ax2.axvline(x=3.50, color="#1B9E77", linestyle=':', linewidth=1.5, alpha=0.5)
    
    ax2.set_xlabel("Delivered Cost (EUR/kgH₂)")
    ax2.set_ylabel("Number of Sites")
    ax2.set_title("Distribution Shift: 2025 vs 2030", fontsize=13, fontweight='bold')
    ax2.legend()
    ax2.spines['top'].set_visible(False)
    
    plt.suptitle("2030 Technology Improvements and De-risking Projections", 
                fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig07_2030_projection.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig07_2030_projection.png")


def fig8_shipping_analysis(baseline):
    """Figure 8: Shipping distance vs delivered cost relationship."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    
    # Left: Shipping distance by region
    ax = axes[0]
    
    west = baseline[baseline["lon"] < 18]
    east = baseline[baseline["lon"] >= 18]
    
    ax.scatter(west["shipping_distance_km"], west["delivered_cost"], 
              c="#2E86AB", s=120, label=f"West African sites (n={len(west)})", 
              edgecolors='#333', linewidths=1.5, zorder=5)
    ax.scatter(east["shipping_distance_km"], east["delivered_cost"],
              c="#C73E1D", s=120, label=f"East African sites (n={len(east)})",
              edgecolors='#333', linewidths=1.5, zorder=5)
    
    # Correlation annotation
    all_costs = baseline["delivered_cost"].values
    all_dist = baseline["shipping_distance_km"].values
    corr = np.corrcoef(all_dist, all_costs)[0, 1]
    
    ax.set_xlabel("Estimated Shipping Distance to Europe (km)")
    ax.set_ylabel("Delivered Cost (EUR/kgH₂)")
    ax.set_title(f"Shipping Distance vs Delivered Cost (r = {corr:.2f})", fontsize=13, fontweight='bold')
    ax.legend()
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Add trend line
    z = np.polyfit(all_dist, all_costs, 1)
    p = np.poly1d(z)
    x_line = np.linspace(all_dist.min(), all_dist.max(), 100)
    ax.plot(x_line, p(x_line), "--", color="gray", alpha=0.5, linewidth=1.5)
    
    # Right: Cost vs ocean proximity
    ax2 = axes[1]
    
    sc = ax2.scatter(baseline["ocean_dist_km"], baseline["delivered_cost"],
                    c=baseline["lat"], cmap="coolwarm", s=120, 
                    edgecolors="#333", linewidths=1.5, zorder=5)
    
    ax2.set_xlabel("Distance to Ocean Coast (km)")
    ax2.set_ylabel("Delivered Cost (EUR/kgH₂)")
    ax2.set_title("Ocean Proximity and Latitude Effects", fontsize=13, fontweight='bold')
    ax2.legend(*sc.legend_elements(), title="Latitude", fontsize=9)
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    
    plt.suptitle("Marine Logistics: Distance and Location Effects on Delivered Cost", 
                fontsize=14, fontweight='bold', y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig08_shipping_analysis.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig08_shipping_analysis.png")


def fig9_carbon_analysis():
    """Figure 9: Carbon pricing break-even analysis."""
    fig, ax = plt.subplots(figsize=(10, 7))
    
    co2_prices = [0, 50, 100, 150, 200]  # EUR/tCO2
    ammonia_intensity = 1.83  # tCO2 / tNH3
    
    # Grey ammonia cost with carbon price
    grey_base = 0.45  # EUR/kgNH3
    grey_with_carbon = [grey_base * (1 + cp * ammonia_intensity / 1000) for cp in co2_prices]
    
    # Green ammonia equivalent: our delivered cost includes conversion
    # Green NH3 cost ≈ LCOH * 5.67 + conversion
    # From our model: delivered ~€5.64 = LCOH(~€2.9) + conv(~€1.0) + ship(~€0.4) + recon(~€1.17)
    # Green NH3 at production: LCOH*5.67 + conv*5.67 = ~€2.9*5.67 + ~1.0*5.67 = ~€22/kgNH3?? 
    # That's wrong. Let me recalculate.
    
    # Actually: 1 kg H2 -> 5.67 kg NH3
    # LCOH per kg H2 = €2.9
    # So NH3 production cost (at plant) = €2.9/5.67 = €0.51/kgNH3 (just H2 feedstock)
    # Plus conversion: €1.0/5.67 = €0.18/kgNH3
    # Total green NH3 (at African port): ~€0.69/kgNH3
    
    # For break-even: green NH3 = grey NH3 + carbon cost
    green_nh3_cost = 0.69  # EUR/kgNH3 (estimated from model)
    
    break_even_carbon = []
    for cp in co2_prices:
        grey_eq = grey_base * (1 + cp * ammonia_intensity / 1000)
        break_even_carbon.append(grey_eq)
    
    # Find break-even point
    # green_nh3 = grey_base * (1 + BE * intensity / 1000)
    # BE = (green_nh3/grey_base - 1) * 1000 / intensity
    break_even = (green_nh3_cost / grey_base - 1) * 1000 / ammonia_intensity
    
    ax.plot(co2_prices, break_even_carbon, '-', color="#BC4749", linewidth=2.5, 
           marker='o', markersize=8, label="Grey Ammonia (with carbon price)")
    ax.axhline(y=green_nh3_cost, color="#6A994E", linestyle='--', linewidth=2.5,
              marker='s', markersize=8, label=f"Green Ammonia (model estimate, €{green_nh3_cost:.2f}/kg)")
    
    # Fill crossover region
    ax.fill_between(co2_prices, break_even_carbon, green_nh3_cost, 
                   where=[b >= green_nh3_cost for b in break_even_carbon],
                   alpha=0.15, color='#6A994E')
    
    # Annotation
    ax.annotate(f'Break-even carbon price:\n€{break_even:.0f}/tCO₂',
               xy=(break_even, green_nh3_cost), xytext=(break_even+20, green_nh3_cost-0.08),
               fontsize=11, fontweight='bold', color='#6A994E',
               arrowprops=dict(arrowstyle='->', color='#6A994E', lw=2))
    
    ax.set_xlabel("Carbon Price (EUR/tCO₂)", fontsize=12)
    ax.set_ylabel("Ammonia Cost (EUR/kgNH₃)", fontsize=12)
    ax.set_title("Carbon Pricing: Green vs Grey Ammonia Competitiveness", fontsize=13, fontweight='bold')
    ax.legend(loc='upper left', framealpha=0.9)
    ax.grid(True, alpha=0.3)
    ax.spines['top'].set_visible(False)
    ax.set_xlim(-10, 220)
    
    # Add context annotations
    ax.axvspan(0, 50, alpha=0.05, color='gray')
    ax.text(25, 0.85, 'Current\n~€0-50/t', ha='center', fontsize=9, alpha=0.7)
    ax.axvspan(100, 200, alpha=0.05, color='red')
    ax.text(150, 0.85, 'EU CBAM\n~€100-200/t', ha='center', fontsize=9, alpha=0.7)
    
    plt.tight_layout()
    plt.savefig(os.path.join(IMAGES_DIR, "fig09_carbon_analysis.png"), dpi=150, bbox_inches='tight')
    plt.close()
    print("Saved: fig09_carbon_analysis.png")


def generate_all_figures():
    """Generate all report figures."""
    print("=" * 60)
    print("Generating Report Figures")
    print("=" * 60)
    
    baseline, comparison, ir_sens, europe, scenarios = load_outputs()
    
    fig1_data_overview(baseline)
    fig2_lcoh_spatial(baseline)
    fig3_cost_breakdown(baseline)
    fig4_scenario_comparison(comparison, scenarios)
    fig5_interest_rate_sensitivity(ir_sens, europe)
    fig6_africa_vs_europe(europe, baseline, scenarios)
    fig7_2030_projection(scenarios, baseline)
    fig8_shipping_analysis(baseline)
    fig9_carbon_analysis()
    
    print("\nAll figures generated successfully!")


if __name__ == "__main__":
    generate_all_figures()
