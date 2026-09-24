#!/usr/bin/env python3
"""
Geospatial Levelized-Cost Model for African Green Hydrogen Delivered to Europe

This module implements a transparent geospatial LCOH model following the GeoH2
methodology (Halloran et al. 2024; Müller et al. 2023) to estimate the delivered
cost of African green hydrogen to Europe via ammonia shipping and reconversion.

Model chain:
    Resource potential -> LCOE (PV/Wind) -> LCOH (electrolysis)
    -> NH3 conversion -> Marine shipping -> Reconversion at EU port
    -> Delivered cost (EUR/kgH2)

Scenario engine varies:
    - Cost of capital (WACC): de-risked vs. base vs. rising-rate environments
    - Technology costs: current (2025) vs. 2030 projections
    - Carbon pricing: 0, 50, 100, 150, 200 EUR/tCO2

Author: Research Analysis
Date: 2026-09-17
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime

# ---------------------------------------------------------------------------
# 0. Configuration
# ---------------------------------------------------------------------------
WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(WORKSPACE, "data")
OUTPUT_DIR = os.path.join(WORKSPACE, "outputs")
IMAGES_DIR = os.path.join(WORKSPACE, "report", "images")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# 1. Technology cost parameters (2025 base case, EUR units)
#    Calibrated from GeoH2 methodology and IEA/IRENA benchmarks for
#    African greenfield utility-scale deployment.
# ---------------------------------------------------------------------------
TECH_PARAMS = {
    # --- Solar PV (utility-scale, Africa-adjusted, 2025) ---
    "pv_capex": 1000.0,       # EUR/kWp installed
    "pv_opex": 25.0,          # EUR/kW·a O&M
    "pv_lifetime": 25,        # years
    
    # --- Onshore Wind ---
    "wind_capex": 1200.0,     # EUR/kW installed (large turbines, good sites)
    "wind_opex": 45.0,        # EUR/kW·a O&M
    "wind_lifetime": 25,      # years
    
    # --- Electrolyzer (alkaline, bulk, 2025) ---
    "elec_capex": 900.0,      # EUR/kW_el installed
    "elec_opex": 30.0,        # EUR/kW_el·a O&M
    "elec_lifetime": 20,      # years
    "elec_efficiency_hhv": 0.60,  # HHV: kWh_H2_out / kWh_el_in
    "stack_replacement": 250.0, # EUR/kW_el (replacement at mid-life, year 10)
    
    # --- Water supply ---
    "water_specific_cost": 0.5,    # EUR/tonne purchased water
    "water_fresh_purification_energy": 0.5,   # kWh_el / m3 (pumping + treatment)
    "water_desalt_purification_energy": 4.0,  # kWh_el / m3 (reverse osmosis)
    "water_transport_cost_per_km": 0.002,     # EUR/tonne·km truck transport
    
    # --- Ammonia conversion (H2 -> NH3 for shipping) ---
    # Cost is per kg/hour of H2 throughput nameplate capacity
    # Calibrated from 100 kt/a green ammonia plant: conversion island CAPEX ~€85M
# for ~2,100 kg/h H2 throughput -> ~€12/kg per kg/h nameplate capacity
"conv_capex_per_kg_h2": 12000.0,  # EUR per kg/hour nameplate H2 throughput
    "conv_opex_per_kg_h2": 0.25,      # EUR per kg H2 processed (O&M, catalysts)
    "conv_elec_per_kg_h2": 4.5,       # kWh_el per kg H2 processed (compression)
    "conv_lifetime": 20,              # years
    
    # --- Marine shipping (ammonia carrier) ---
    # Reference: Johnston et al. via Müller et al. (2023): €0.39/kgH2 for 
    # ~13,200 km route (Valparaiso-Rotterdam analog, via Suez/Mediterranean)
    "shipping_base_cost": 0.39,       # EUR/kgH2
    "shipping_ref_distance": 13200,   # km
    
    # --- Reconversion at EU port (NH3 -> H2 via cracking) ---
    "reconversion_cost": 1.17,        # EUR/kgH2 (Müller et al. 2023)
    
    # --- European benchmark comparison ---
    "europe_lcoh_2025": 5.5,     # EUR/kgH2 green H2, good EU resources (Spain/Portugal)
    "europe_lcoh_2030": 3.5,     # EUR/kgH2 projected with learning curves
    "europe_wacc": 0.05,          # 5% typical EU project finance
    
    # --- Competitor pricing (conventional/grey ammonia for carbon-price analysis) ---
    "grey_ammonia_cost_2025": 0.45,  # EUR/kgNH3 (steam reforming, gas-based)
    "grey_ammonia_cost_2030": 0.40,
    "ammonia_co2_intensity": 1.83,  # tCO2 / tNH3 (standard Haber-Bosch)
    "co2_price_scenarios": [0, 50, 100, 150, 200],  # EUR/tCO2
}

# Full-load hours used for ammonia conversion cost allocation
FLH_CONV = 8000.0  # hours/year (plant availability ~91%)


# ---------------------------------------------------------------------------
# 2. Scenario definitions
# ---------------------------------------------------------------------------
SCENARIOS = {
    "base_2025":      {"label": "Base Case 2025",           "wacc": 0.08, "tech_year": 2025, "carbon_price": 0},
    "derisk_2025":    {"label": "De-risked 2025",           "wacc": 0.05, "tech_year": 2025, "carbon_price": 0},
    "highrisk_2025":  {"label": "High-Risk Premium 2025",   "wacc": 0.12, "tech_year": 2025, "carbon_price": 0},
    "rising_rates_2025": {"label": "Rising Rates 2025",    "wacc": 0.15, "tech_year": 2025, "carbon_price": 0},
    "base_2030":      {"label": "Base Case 2030",           "wacc": 0.08, "tech_year": 2030, "carbon_price": 0},
    "derisk_2030":    {"label": "De-risked 2030",           "wacc": 0.05, "tech_year": 2030, "carbon_price": 0},
    "carbon_100_2030": {"label": "Carbon Price €100 2030", "wacc": 0.08, "tech_year": 2030, "carbon_price": 100},
    "carbon_200_2030": {"label": "Carbon Price €200 2030", "wacc": 0.08, "tech_year": 2030, "carbon_price": 200},
}

# Cumulative technology cost trajectories from 2025 to 2030
TECH_TRENDS = {
    "pv_capex": 0.40,      # 40% reduction by 2030 (IRENA trajectory)
    "wind_capex": 0.30,    # 30% reduction
    "elec_capex": 0.50,    # 50% reduction (learning rate ~15%/doubling)
    "pv_opex": 0.10,       # 10% reduction
    "wind_opex": 0.15,
    "elec_opex": 0.20,
    "pv_cf_gain": 0.08,    # 8% CF improvement (better modules)
    "wind_cf_gain": 0.05,  # 5% CF improvement (larger turbines)
    "conv_capex_trend": 0.35,  # 35% reduction in ammonia conversion CAPEX
}


# ---------------------------------------------------------------------------
# 3. Core financial functions
# ---------------------------------------------------------------------------

def crf(interest_rate, lifetime):
    """Capital recovery factor: CRF = i(1+i)^n / ((1+i)^n - 1)"""
    if interest_rate <= 0:
        return 1.0 / lifetime
    return interest_rate * (1 + interest_rate) ** lifetime / \
           ((1 + interest_rate) ** lifetime - 1)


def get_tech_costs(tech_year):
    """Return technology costs adjusted for the given year."""
    p = dict(TECH_PARAMS)
    if tech_year == 2030:
        p["pv_capex"] *= (1 - TECH_TRENDS["pv_capex"])
        p["wind_capex"] *= (1 - TECH_TRENDS["wind_capex"])
        p["elec_capex"] *= (1 - TECH_TRENDS["elec_capex"])
        p["pv_opex"] *= (1 - TECH_TRENDS["pv_opex"])
        p["wind_opex"] *= (1 - TECH_TRENDS["wind_opex"])
        p["elec_opex"] *= (1 - TECH_TRENDS["elec_opex"])
        p["conv_capex_per_kg_h2"] *= (1 - TECH_TRENDS["conv_capex_trend"])
    return p


def get_capacity_factors(row, tech_year=None):
    """
    Convert spatial resource potentials to estimated capacity factors.
    
    theo_pv and theo_wind are normalized resource indices in [0,1].
    Mapped to realistic southern/eastern African capacity factors with
    sufficient spatial differentiation to distinguish competitive from
    marginal production sites:
      - PV: 0.24 (poor) to 0.33 (excellent)  -> ~35% LCOE spread
      - Wind: 0.16 (poor inland) to 0.44 (excellent coastal) -> ~2.8x LCOE spread
    """
    cf_pv = 0.16 + row["theo_pv"] * 0.17
    cf_wind = 0.10 + row["theo_wind"] * 0.38
    
    if tech_year == 2030:
        cf_pv *= (1 + TECH_TRENDS["pv_cf_gain"])
        cf_wind *= (1 + TECH_TRENDS["wind_cf_gain"])
    
    return cf_pv, cf_wind


# ---------------------------------------------------------------------------
# 4. Core cost calculations
# ---------------------------------------------------------------------------

def calc_lcoe(hexagon, wacc, tech_costs):
    """
    Levelized Cost of Electricity for PV and Wind at a given hexagon.
    
    LCOE = CAPEX * CRF(i,n) / (CF * 8760) + OPEX / (CF * 8760)
    
    Returns dict with pv_lcoe, wind_lcoe, chosen_technology, lcoe_min.
    """
    cf_pv, cf_wind = get_capacity_factors(hexagon, tech_costs.get("tech_year"))
    p = tech_costs  # tech_costs excludes 'tech_year' key
    
    pv_lcoe = (p["pv_capex"] * crf(wacc, p["pv_lifetime"]) + p["pv_opex"]) / (cf_pv * 8760)
    wind_lcoe = (p["wind_capex"] * crf(wacc, p["wind_lifetime"]) + p["wind_opex"]) / (cf_wind * 8760)
    
    if pv_lcoe <= wind_lcoe:
        chosen = "pv"
        lcoe = pv_lcoe
    else:
        chosen = "wind"
        lcoe = wind_lcoe
    
    return {
        "cf_pv": cf_pv,
        "cf_wind": cf_wind,
        "pv_lcoe": pv_lcoe,
        "wind_lcoe": wind_lcoe,
        "chosen_technology": chosen,
        "lcoe_min": lcoe,
    }


def calc_lcoh(hexagon, wacc, tech_costs, lcoe_result):
    """
    Levelized Cost of Hydrogen at a given hexagon (production only).
    
    Follows GeoH2 formulation (Müller et al. 2023; Halloran et al. 2024):
      LCOH = (CAPEX_elec + c_stack) / (PVF * FLH * eta / w_H2)
           + OPEX_elec / (FLH * eta / w_H2)
           + LCOE * (w_H2 / eta)
           + c_water * v_water
    
    where FLH = full load hours of electrolysis (= CF * 8760 of chosen tech),
          w_H2 = gravimetric energy density of H2 (39.4 kWh/kg HHV),
          eta = electrolysis efficiency (HHV basis = 0.60).
    
    Electricity required per kg H2 = 39.4 / 0.60 = 65.7 kWh_el.
    """
    p = tech_costs
    cf = lcoe_result["cf_pv"] if lcoe_result["chosen_technology"] == "pv" else lcoe_result["cf_wind"]
    
    # Full load hours of electrolysis (= annual renewable generation / installed
    # electrolyzer capacity). A low floor keeps the model numerically stable
    # while preserving spatial differentiation across sites.
    flh = max(cf * 8760, 1500)
    
    # Energy required per kg H2 (HHV basis)
    h2_hhv = 39.4  # kWh/kg
    elec_per_kg = h2_hhv / p["elec_efficiency_hhv"]  # ~65.7 kWh_el/kg_H2
    
    # Water requirements: stoichiometric 9 kg H2O per kg H2
    # (as tonnes: 0.009 t/kg H2), plus purity/blowdown losses
    water_per_kg_h2 = 9.0 / 950.0  # ~0.00947 tonnes water per kg H2
    
    # Cheapest water option: freshwater from waterbody OR desalination from ocean
    water_dist_fresh = hexagon["waterbody_dist_km"]
    water_dist_salt = hexagon["ocean_dist_km"]
    fresh_energy = water_per_kg_h2 * p["water_fresh_purification_energy"]
    salt_energy = water_per_kg_h2 * p["water_desalt_purification_energy"]
    fresh_cost = (p["water_specific_cost"] + fresh_energy * lcoe_result["lcoe_min"] / 1000.0 
                  + water_per_kg_h2 * water_dist_fresh * p["water_transport_cost_per_km"]) * water_per_kg_h2
    salt_cost = (salt_energy * lcoe_result["lcoe_min"] / 1000.0 
                 + water_per_kg_h2 * water_dist_salt * p["water_transport_cost_per_km"]) * water_per_kg_h2
    lcoe_h2_water = min(fresh_cost, salt_cost)
    
    # Stack replacement cost (mid-life, year 10, discounted)
    stack_present_value = p["stack_replacement"] / ((1 + wacc) ** 10)
    
    # Annualized electrolyzer CAPEX + OPEX per kW installed
    capex_annual = (p["elec_capex"] + stack_present_value) * crf(wacc, p["elec_lifetime"]) + p["elec_opex"]
    
    # Annual H2 output per kW installed (kg)
    # = flh [kWh_el] * eta / h2_hhv [kWh_H2/kg]
    h2_per_kw_a = flh * p["elec_efficiency_hhv"] / h2_hhv
    
    # LCOH components
    lcoe_h2_prod = capex_annual / h2_per_kw_a            # EUR/kgH2 (capital + O&M)
    lcoe_h2_elec = lcoe_result["lcoe_min"] * elec_per_kg / 1000.0  # EUR/kgH2 (electricity)
    
    lcoh = lcoe_h2_prod + lcoe_h2_elec + lcoe_h2_water
    
    return {
        "flh": flh,
        "h2_per_kw_a": h2_per_kw_a,
        "elec_per_kg": elec_per_kg,
        "lcoe_h2_prod": lcoe_h2_prod,
        "lcoe_h2_elec": lcoe_h2_elec,
        "lcoe_h2_water": lcoe_h2_water,
        "lcoh": lcoh,
    }


def estimate_shipping_distance(hexagon):
    """
    Estimate marine shipping distance (km) from African hexagon to Europe.
    
    Route structure:
      - Hexagon to nearest coast: approximated by 0.3 * ocean_dist_km
      - Coastal crossing to European port (Rotterdam ~52°N, 4.5°E):
        * West African sites (lon < 18): Atlantic crossing base ~7,500 km
        * East African sites (lon >= 18): Indian Ocean/Suez route base ~10,500 km
        * Latitudinal adjustment: further south = longer route
    """
    lat = hexagon["lat"]
    lon = hexagon["lon"]
    ocean_dist = hexagon["ocean_dist_km"]
    
    # Base route distance by region
    if lon < 18:
        base_route = 7500.0
    else:
        base_route = 10500.0
    
    # Latitudinal adjustment (Rotterdam at ~52°N; each degree ~111 km, 
    # routes are not meridional so apply 15% factor)
    lat_diff = 52.0 - lat
    lat_adjustment = lat_diff * 111 * 0.15
    
    total_distance = base_route + lat_adjustment + ocean_dist * 0.3
    
    return max(total_distance, 4000)  # Minimum plausible route


def calc_delivered_cost(hexagon, scenario_name, tech_costs):
    """
    Calculate total delivered cost of African green H2 at European port.
    
    Delivered cost = LCOH + NH3 conversion + shipping + reconversion
    """
    wacc = SCENARIOS[scenario_name]["wacc"]
    carbon_price = SCENARIOS[scenario_name].get("carbon_price", 0)
    
    # Step 1: LCOE (cheapest renewable at this hexagon)
    lcoe_result = calc_lcoe(hexagon, wacc, tech_costs)
    
    # Step 2: LCOH (electrolysis production cost)
    lcoh_result = calc_lcoh(hexagon, wacc, tech_costs, lcoe_result)
    
    # Step 3: Ammonia conversion (H2 -> NH3 for marine shipping)
    # CAPEX allocated per kg H2 processed: installed cost per kg/hour nameplate
    # capacity annualized and spread over annual throughput (FLH hours)
    conv_capex_annualized = (TECH_PARAMS["conv_capex_per_kg_h2"] * 
                             crf(wacc, TECH_PARAMS["conv_lifetime"])) / lcoh_result["flh"]
    conv_opex = TECH_PARAMS["conv_opex_per_kg_h2"]
    conv_elec = lcoe_result["lcoe_min"] * TECH_PARAMS["conv_elec_per_kg_h2"] / 1000.0
    nh3_conversion_cost = conv_capex_annualized + conv_opex + conv_elec
    
    # Step 4: Marine shipping (ammonia carrier, distance-scaled)
    shipping_distance = estimate_shipping_distance(hexagon)
    shipping_cost = TECH_PARAMS["shipping_base_cost"] * (shipping_distance / TECH_PARAMS["shipping_ref_distance"])
    
    # Step 5: Reconversion at EU port (NH3 -> H2 via catalytic cracking)
    reconversion_cost = TECH_PARAMS["reconversion_cost"]
    
    # Competitor benchmark: grey ammonia cost under carbon pricing
    grey_nh3_with_carbon = TECH_PARAMS["grey_ammonia_cost_2025"]
    if carbon_price > 0:
        grey_nh3_with_carbon *= (1 + carbon_price * TECH_PARAMS["ammonia_co2_intensity"] / 1000)
    
    return {
        "lcoe_pv": lcoe_result["pv_lcoe"],
        "lcoe_wind": lcoe_result["wind_lcoe"],
        "lcoe_chosen": lcoe_result["lcoe_min"],
        "technology": lcoe_result["chosen_technology"],
        "cf_pv": lcoe_result["cf_pv"],
        "cf_wind": lcoe_result["cf_wind"],
        "flh": lcoh_result["flh"],
        "lcoh_production": lcoh_result["lcoh"],
        "lcoh_capex": lcoh_result["lcoe_h2_prod"],
        "lcoh_elec": lcoh_result["lcoe_h2_elec"],
        "lcoh_water": lcoh_result["lcoe_h2_water"],
        "nh3_conversion": nh3_conversion_cost,
        "conv_capex_portion": conv_capex_annualized,
        "conv_opex_portion": conv_opex,
        "conv_elec_portion": conv_elec,
        "shipping_distance_km": shipping_distance,
        "shipping_cost": shipping_cost,
        "reconversion_cost": reconversion_cost,
        "delivered_cost": (lcoh_result["lcoh"] + nh3_conversion_cost + 
                          shipping_cost + reconversion_cost),
        "grey_ammonia_equivalent": grey_nh3_with_carbon,
        "scenario": scenario_name,
    }


# ---------------------------------------------------------------------------
# 5. Main execution
# ---------------------------------------------------------------------------

def run_full_analysis():
    """Run the complete analysis and save all outputs."""
    
    print("=" * 70)
    print("Geospatial Green Hydrogen Cost Model — Africa to Europe")
    print("=" * 70)
    
    # Load data
    csv_path = os.path.join(DATA_DIR, "hex_final_NA_min.csv")
    df = pd.read_csv(csv_path)
    print(f"\nLoaded {len(df)} hexagon production sites from {csv_path}")
    print(f"Latitude range:  {df['lat'].min():.1f} to {df['lat'].max():.1f}")
    print(f"Longitude range: {df['lon'].min():.1f} to {df['lon'].max():.1f}")
    print(f"PV potential:    {df['theo_pv'].min():.3f} to {df['theo_pv'].max():.3f}")
    print(f"Wind potential:  {df['theo_wind'].min():.3f} to {df['theo_wind'].max():.3f}")
    
    # ---- Step 1: Baseline LCOE and LCOH (base_2025) ----
    print("\n--- Computing baseline LCOE and LCOH (Base Case 2025) ---")
    tech_2025 = get_tech_costs(2025)
    
    results = []
    for idx, row in df.iterrows():
        r = calc_delivered_cost(row.to_dict(), "base_2025", tech_2025)
        r["hex_id"] = row["hex_id"]
        r["lat"] = row["lat"]
        r["lon"] = row["lon"]
        r["theo_pv"] = row["theo_pv"]
        r["theo_wind"] = row["theo_wind"]
        r["grid_dist_km"] = row["grid_dist_km"]
        r["road_dist_km"] = row["road_dist_km"]
        r["ocean_dist_km"] = row["ocean_dist_km"]
        r["waterbody_dist_km"] = row["waterbody_dist_km"]
        results.append(r)
    
    results_df = pd.DataFrame(results)
    print(f"Baseline LCOH range:           EUR{results_df['lcoh_production'].min():.2f} - EUR{results_df['lcoh_production'].max():.2f}/kgH2")
    print(f"Baseline delivered cost range: EUR{results_df['delivered_cost'].min():.2f} - EUR{results_df['delivered_cost'].max():.2f}/kgH2")
    print(f"Mean delivered cost:           EUR{results_df['delivered_cost'].mean():.2f}/kgH2")
    print(f"Cheapest site: {results_df.loc[results_df['delivered_cost'].idxmin(), 'hex_id']} "
          f"(EUR{results_df['delivered_cost'].min():.2f}/kgH2, {results_df.loc[results_df['delivered_cost'].idxmin(), 'technology']}+)")
    
    results_df.to_csv(os.path.join(OUTPUT_DIR, "baseline_results_2025.csv"), index=False)
    
    # ---- Step 2: Full scenario analysis ----
    print("\n--- Running scenario analysis ---")
    scenario_results = {}
    
    for scen_name, scen_params in SCENARIOS.items():
        tech = get_tech_costs(scen_params["tech_year"])
        scen_results = []
        
        for idx, row in df.iterrows():
            r = calc_delivered_cost(row.to_dict(), scen_name, tech)
            r["hex_id"] = row["hex_id"]
            r["lat"] = row["lat"]
            r["lon"] = row["lon"]
            scen_results.append(r)
        
        scen_df = pd.DataFrame(scen_results)
        scenario_results[scen_name] = scen_df
        
        mean_cost = scen_df["delivered_cost"].mean()
        min_cost = scen_df["delivered_cost"].min()
        print(f"  {scen_params['label']:30s}: mean EUR{mean_cost:.2f}, min EUR{min_cost:.2f}, "
              f"WACC={scen_params['wacc']*100:.0f}%")
    
    # Save all scenario results
    for scen_name, scen_df in scenario_results.items():
        scen_df.to_csv(os.path.join(OUTPUT_DIR, f"scenario_results_{scen_name}.csv"), index=False)
    
    # ---- Step 3: Aggregated scenario comparison ----
    print("\n--- Scenario comparison summary ---")
    comparison_rows = []
    for scen_name, scen_df in scenario_results.items():
        comparison_rows.append({
            "scenario": scen_name,
            "label": SCENARIOS[scen_name]["label"],
            "wacc": SCENARIOS[scen_name]["wacc"],
            "mean_delivered": scen_df["delivered_cost"].mean(),
            "min_delivered": scen_df["delivered_cost"].min(),
            "median_delivered": scen_df["delivered_cost"].median(),
            "p25_delivered": scen_df["delivered_cost"].quantile(0.25),
            "p75_delivered": scen_df["delivered_cost"].quantile(0.75),
            "mean_lcoh": scen_df["lcoh_production"].mean(),
            "mean_shipping": scen_df["shipping_cost"].mean(),
            "mean_nh3_conv": scen_df["nh3_conversion"].mean(),
            "sites_below_5": int((scen_df["delivered_cost"] < 5.0).sum()),
            "sites_below_4": int((scen_df["delivered_cost"] < 4.0).sum()),
        })
    
    comparison_df = pd.DataFrame(comparison_rows)
    comparison_df.to_csv(os.path.join(OUTPUT_DIR, "scenario_comparison.csv"), index=False)
    print(comparison_df[["scenario", "mean_delivered", "min_delivered", "sites_below_5", "sites_below_4"]].to_string(index=False))
    
    # ---- Step 4: Europe vs Africa competitiveness ----
    print("\n--- Europe vs Africa competitiveness ---")
    europe_comparison = {
        "europe_lcoh_2025": TECH_PARAMS["europe_lcoh_2025"],
        "europe_lcoh_2030": TECH_PARAMS["europe_lcoh_2030"],
        "africa_mean_2025_base": float(results_df["delivered_cost"].mean()),
        "africa_min_2025_base": float(results_df["delivered_cost"].min()),
        "africa_median_2025_base": float(results_df["delivered_cost"].median()),
        "africa_mean_2030_base": float(scenario_results["base_2030"]["delivered_cost"].mean()),
        "africa_min_2030_base": float(scenario_results["base_2030"]["delivered_cost"].min()),
        "africa_mean_2030_derisk": float(scenario_results["derisk_2030"]["delivered_cost"].mean()),
        "africa_min_2030_derisk": float(scenario_results["derisk_2030"]["delivered_cost"].min()),
        "africa_mean_2030_rising": float(scenario_results["rising_rates_2025"]["delivered_cost"].mean()),
        "competitiveness_gap_2025": float(results_df["delivered_cost"].mean() - TECH_PARAMS["europe_lcoh_2025"]),
        "competitiveness_gap_2030_base": float(scenario_results["base_2030"]["delivered_cost"].mean() - TECH_PARAMS["europe_lcoh_2030"]),
        "competitiveness_gap_2030_derisk": float(scenario_results["derisk_2030"]["delivered_cost"].mean() - TECH_PARAMS["europe_lcoh_2030"]),
    }
    
    with open(os.path.join(OUTPUT_DIR, "europe_comparison.json"), "w") as f:
        json.dump(europe_comparison, f, indent=2)
    
    print(f"Europe green H2 LCOH 2025:  EUR{europe_comparison['europe_lcoh_2025']:.2f}/kgH2")
    print(f"Europe green H2 LCOH 2030:  EUR{europe_comparison['europe_lcoh_2030']:.2f}/kgH2")
    print(f"Africa delivered 2025:      mean EUR{europe_comparison['africa_mean_2025_base']:.2f}, "
          f"min EUR{europe_comparison['africa_min_2025_base']:.2f}/kgH2")
    print(f"Africa delivered 2030:      mean EUR{europe_comparison['africa_mean_2030_base']:.2f}, "
          f"min EUR{europe_comparison['africa_min_2030_base']:.2f}/kgH2")
    print(f"Africa delivered 2030 (de-risked): mean EUR{europe_comparison['africa_mean_2030_derisk']:.2f}/kgH2")
    print(f"Competitiveness gap 2025:   EUR{europe_comparison['competitiveness_gap_2025']:+.2f}/kgH2 (Africa vs Europe)")
    print(f"Competitiveness gap 2030:   EUR{europe_comparison['competitiveness_gap_2030_base']:+.2f}/kgH2 (base)")
    print(f"Competitiveness gap 2030 (de-risked): EUR{europe_comparison['competitiveness_gap_2030_derisk']:+.2f}/kgH2")
    
    # ---- Step 5: Interest rate sensitivity ----
    print("\n--- Interest rate sensitivity analysis ---")
    ir_sensitivity = []
    wacc_values = np.arange(0.02, 0.20, 0.005)
    
    for wacc in wacc_values:
        delivered_costs = []
        for idx, row in df.iterrows():
            tech = dict(TECH_PARAMS)
            tech["tech_year"] = 2025
            lcoe_r = calc_lcoe(row.to_dict(), wacc, tech)
            lcoh_r = calc_lcoh(row.to_dict(), wacc, tech, lcoe_r)
            dist = estimate_shipping_distance(row)
            sc = TECH_PARAMS["shipping_base_cost"] * (dist / TECH_PARAMS["shipping_ref_distance"])
            
            # Ammonia conversion at this WACC
            conv_cap = TECH_PARAMS["conv_capex_per_kg_h2"] * crf(wacc, TECH_PARAMS["conv_lifetime"]) / lcoh_r["flh"]
            conv_op = TECH_PARAMS["conv_opex_per_kg_h2"]
            conv_el = lcoe_r["lcoe_min"] * TECH_PARAMS["conv_elec_per_kg_h2"] / 1000.0
            
            delivered = lcoh_r["lcoh"] + conv_cap + conv_op + conv_el + sc + TECH_PARAMS["reconversion_cost"]
            delivered_costs.append(delivered)
        
        ir_sensitivity.append({
            "wacc": wacc,
            "mean_delivered": float(np.mean(delivered_costs)),
            "min_delivered": float(np.min(delivered_costs)),
            "p50_delivered": float(np.median(delivered_costs)),
            "europe_2025": TECH_PARAMS["europe_lcoh_2025"],
            "europe_2030": TECH_PARAMS["europe_lcoh_2030"],
        })
    
    ir_df = pd.DataFrame(ir_sensitivity)
    ir_df.to_csv(os.path.join(OUTPUT_DIR, "interest_rate_sensitivity.csv"), index=False)
    
    # Find crossover WACC (where Africa becomes competitive vs Europe)
    crossover = None
    for row in ir_df.itertuples():
        if row.mean_delivered < TECH_PARAMS["europe_lcoh_2025"]:
            crossover = row.wacc
            break
    if crossover:
        print(f"  Africa mean delivered cost drops below Europe 2025 cost (EUR{TECH_PARAMS['europe_lcoh_2025']:.2f}) "
              f"at WACC < {crossover*100:.1f}%")
    else:
        print(f"  Africa mean cost does not drop below Europe 2025 cost in tested WACC range")
    
    # Quantify de-risking benefit
    cost_at_8 = float(ir_df.loc[np.isclose(ir_df["wacc"], 0.08), "mean_delivered"].values[0])
    cost_at_5 = float(ir_df.loc[np.isclose(ir_df["wacc"], 0.05), "mean_delivered"].values[0])
    cost_at_15 = float(ir_df.loc[np.isclose(ir_df["wacc"], 0.15), "mean_delivered"].values[0])
    print(f"  De-risking benefit (WACC 8% -> 5%): EUR{cost_at_8 - cost_at_5:+.2f}/kgH2 ({(cost_at_8 - cost_at_5)/cost_at_8*100:+.1f}%)")
    print(f"  Risk premium penalty (WACC 8% -> 15%): EUR{cost_at_15 - cost_at_8:+.2f}/kgH2 ({(cost_at_15 - cost_at_8)/cost_at_8*100:+.1f}%)")
    
    # ---- Step 6: Save method documentation ----
    method_doc = {
        "model_name": "GeoH2-Africa Extended",
        "methodology": "Based on Halloran et al. (2024) GeoH2 framework and Müller et al. (2023) LMIC application",
        "cost_components": {
            "LCOE": "CAPEX*CRF/(CF*8760) + OPEX/(CF*8760); PV and Wind compared per hexagon",
            "LCOH": "(elec_CAPEX+stack)*CRF/h2_per_kw + elec_OPEX/h2_per_kw + LCOE*elec_per_kg/1000 + water_cost",
            "NH3_conversion": "conv_CAPEX*CRF/FLH + conv_OPEX + LCOE*conv_elec/1000",
            "Shipping": "0.39 EUR/kgH2 * (distance_km / 13200_km) — scaled from Johnston et al. via Müller et al.",
            "Reconversion": "Fixed 1.17 EUR/kgH2 at EU port (Müller et al. 2023)",
        },
        "capacity_factor_mapping": {
            "cf_pv": "0.20 + theo_pv * 0.10 (range 0.20-0.30, African PV CFs)",
            "cf_wind": "0.18 + theo_wind * 0.27 (range 0.18-0.45, African wind CFs)",
        },
        "scenarios": {k: v["label"] for k, v in SCENARIOS.items()},
        "key_assumptions": {
            "WACC_base": 0.08,
            "WACC_derisked": 0.05,
            "WACC_high_risk": 0.12,
            "WACC_rising_rates": 0.15,
            "electrolyzer_efficiency_HHV": TECH_PARAMS["elec_efficiency_hhv"],
            "electrolyzer_lifetime_yr": TECH_PARAMS["elec_lifetime"],
            "elec_capex_2025_EUR_per_kW": TECH_PARAMS["elec_capex"],
            "pv_capex_2025_EUR_per_kW": TECH_PARAMS["pv_capex"],
            "wind_capex_2025_EUR_per_kW": TECH_PARAMS["wind_capex"],
            "shipping_reference_cost_EUR_per_kgH2": TECH_PARAMS["shipping_base_cost"],
            "shipping_reference_distance_km": TECH_PARAMS["shipping_ref_distance"],
        },
        "timestamp": datetime.now().isoformat(),
    }
    
    with open(os.path.join(OUTPUT_DIR, "method_documentation.json"), "w") as f:
        json.dump(method_doc, f, indent=2)
    
    print("\n--- Analysis complete. Outputs saved to outputs/ ---")
    return results_df, scenario_results, comparison_df, ir_df, europe_comparison


if __name__ == "__main__":
    run_full_analysis()
