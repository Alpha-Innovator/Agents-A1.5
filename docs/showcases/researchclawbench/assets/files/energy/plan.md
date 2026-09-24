# Research Plan: Geospatial Levelized-Cost Model for African Green Hydrogen to Europe

## Task Overview
Build a transparent geospatial LCOH model to estimate delivered cost of African green hydrogen to Europe (via ammonia shipping and reconversion) by 2030 under multiple financing/policy scenarios, identify least-cost locations, and quantify de-risking/interest-rate effects vs. European production.

## Data
- `data/hex_final_NA_min.csv`: 30 African hexagon sites (lat, lon, theo_pv, theo_wind, grid/road/ocean/water distances)
- `data/africa_map/*.shp`: Country boundary shapefile for basemaps

## Related Work (Key Methodology)
- **Paper 000**: GeoH2 model - geospatial optimization of green H2 production, storage, transport, conversion
- **Paper 001** (Müller et al. 2023, Applied Energy): Kenya LMIC green H2 study - exact LCOH/LCOE formulas, ammonia shipping costs (€0.39/kgH2 for ~13,200km), reconversion costs (~€1.17/kgH2), WACC 8%
- **Paper 002** (Steffen 2020): Cost of capital for RE projects - developing vs developed country spreads
- **Paper 003** (Schmidt et al. 2019): Rising interest rates adverse effects on RE transitions

## Phases

### Phase 1: Model Development [Y]
- [Y] Implement LCOE calculation (PV + Wind) per hexagon
- [Y] Implement LCOH calculation (electrolysis, water, stack replacement)
- [Y] Implement ammonia conversion module
- [Y] Implement shipping cost model (distance-scaled from literature)
- [Y] Implement reconversion at European port
- [Y] Implement scenario engine (WACC, carbon price, tech cost evolution)

### Phase 2: Analysis & Outputs [Y]
- [Y] Calculate baseline delivered costs for all 30 hexagons
- [Y] Run scenario analysis (de-risking, rising rates, 2030 improvements, carbon pricing)
- [Y] Compare with European green H2 production costs
- [Y] Identify least-cost locations and competitive thresholds
- [Y] Save all intermediate outputs to outputs/

### Phase 3: Visualization [Y]
- [Y] Figure 1: Data overview map (hexagons with PV/wind potential)
- [Y] Figure 2: LCOH spatial distribution map
- [Y] Figure 3: Delivered cost breakdown (stacked bars or Sankey)
- [Y] Figure 4: Scenario comparison (bar chart with error bands)
- [Y] Figure 5: Interest rate sensitivity tornado/line plot
- [Y] Figure 6: Africa vs Europe competitiveness comparison
- [Y] Figure 7: 2030 projection with tech improvements
- [Y] Figure 8: Shipping distance vs delivered cost scatter
- [Y] Figure 9: Carbon pricing scenario analysis

### Phase 4: Report [Y]
- [Y] Write report/report.md with methodology, results, discussion
- [Y] Include all figures with proper references
- [Y] Academic writing style

## Acceptance Criteria
- [Y] Complete LCOH model following GeoH2 methodology
- [Y] 9 figures in report (>4 required)
- [Y] Scenario analysis covering de-risking and interest rates
- [Y] Europe comparison
- [Y] All code reproducible, all outputs saved

## Key Results Summary
| Metric | Value |
|--------|-------|
| Baseline 2025 mean delivered | EUR 5.64/kgH₂ |
| Baseline 2025 min delivered | EUR 4.66/kgH₂ (hex_013) |
| De-risked 2025 mean | EUR 5.09/kgH₂ (-10%) |
| Rising rates 2025 mean | EUR 7.21/kgH₂ (+28%) |
| Base 2030 mean | EUR 4.36/kgH₂ |
| De-risked 2030 mean | EUR 4.01/kgH₂ |
| Europe 2025 benchmark | EUR 5.50/kgH₂ |
| Europe 2030 benchmark | EUR 3.50/kgH₂ |
| Competitiveness gap 2030 base | +EUR 0.86/kgH₂ |
| Competitiveness gap 2030 derisk | +EUR 0.51/kgH₂ |
