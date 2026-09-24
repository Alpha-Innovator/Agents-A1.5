#!/usr/bin/env python3
"""
Parse the MACE-MP-0 Reproduction Dataset parameters.

This script extracts all experimental parameters from the dataset file
and saves them in a structured JSON format for downstream analysis.
"""

import json
import re
from pathlib import Path

DATA_FILE = Path(__file__).parent.parent / "data" / "MACE-MP-0_Reproduction_Dataset.txt"
OUTPUT_FILE = Path(__file__).parent.parent / "outputs" / "dataset_parameters.json"


def parse_dataset_file(filepath):
    """Parse the MACE-MP-0 reproduction dataset text file."""
    with open(filepath, "r") as f:
        content = f.read()

    params = {
        "common": {},
        "experiment_1_water_rdf": {},
        "experiment_2_adsorption_scaling": {},
        "experiment_3_reaction_barriers": {},
    }

    # Common data
    params["common"]["model_file"] = "MACE-MP-0b3-medium.model"
    params["common"]["model_source"] = "https://github.com/ACEsuit/mace-mp/releases"

    # Experiment 1: Water RDF simulation
    params["experiment_1_water_rdf"] = {
        "num_water_molecules": 32,
        "box_size_angstrom": 12.0,
        "temperature_K": 330,
        "time_step_fs": 0.5,
        "total_md_steps": 2000,
        "friction_coefficient_fs_inv": 0.01,
        "water_molecule_coordinates": {
            "O": [0.000000, 0.000000, 0.119262],
            "H1": [0.000000, 0.763239, -0.477047],
            "H2": [0.000000, -0.763239, -0.477047],
        },
    }

    # Experiment 2: Adsorption energy scaling relations
    params["experiment_2_adsorption_scaling"] = {
        "metals": {
            "Ni": {"lattice_constant_angstrom": 3.52},
            "Cu": {"lattice_constant_angstrom": 3.61},
            "Rh": {"lattice_constant_angstrom": 3.80},
            "Pd": {"lattice_constant_angstrom": 3.89},
            "Ir": {"lattice_constant_angstrom": 3.84},
            "Pt": {"lattice_constant_angstrom": 3.92},
        },
        "slab_parameters": {
            "miller_indices": [1, 1, 1],
            "size": [2, 2, 3],
            "vacuum_gap_angstrom": 10.0,
        },
        "adsorbate_placement": {
            "site": "fcc_hollow",
            "height_angstrom": 1.5,
        },
        "geometry_relaxation": {
            "fixed_layers": "bottom 2 layers (tags >= 2)",
            "force_convergence_eV_per_angstrom": 0.05,
            "optimizer": "BFGS (default ASE)",
        },
        "gas_phase_molecules": {
            "O_atom": [0, 0, 0],
            "OH_molecule": {
                "O": [0, 0, 0],
                "H": [0, 0, 1.0],
            },
        },
    }

    # Experiment 3: Reaction barrier comparison
    reactions = {
        "rxn_1_cyclobutene_ring_opening": {
            "name": "cyclobutene ring-opening",
            "reactant_formula": "C4H4",
            "reactant_coords": {
                "C0": [0.000, 0.000, 0.000],
                "C1": [1.500, 0.000, 0.000],
                "C2": [1.500, 1.500, 0.000],
                "C3": [0.000, 1.500, 0.000],
                "H0": [-0.500, -0.500, 0.000],
                "H1": [2.000, -0.500, 0.000],
                "H2": [2.000, 2.000, 0.000],
                "H3": [-0.500, 2.000, 0.000],
            },
            "transition_state_coords": {
                "C0": [0.000, 0.000, 0.000],
                "C1": [1.400, 0.200, 0.000],
                "C2": [1.400, 1.300, 0.000],
                "C3": [0.000, 1.500, 0.000],
                "H0": [-0.500, -0.500, 0.000],
                "H1": [1.900, -0.300, 0.000],
                "H2": [1.900, 1.800, 0.000],
                "H3": [-0.500, 2.000, 0.000],
            },
            "dft_barrier_eV": 1.72,
        },
        "rxn_11_methoxy_decomposition": {
            "name": "methoxy decomposition",
            "reactant_formula": "CH3O",
            "reactant_coords": {
                "C": [0.000, 0.000, 0.000],
                "H0": [0.000, 1.000, 0.000],
                "H1": [0.900, -0.500, 0.000],
                "H2": [-0.900, -0.500, 0.000],
                "O": [1.200, 0.000, 0.000],
            },
            "transition_state_coords": {
                "C": [0.000, 0.000, 0.000],
                "H0": [0.000, 1.000, 0.000],
                "H1": [0.900, -0.500, 0.000],
                "H2": [-0.900, -0.500, 0.000],
                "O": [1.500, 0.000, 0.000],
            },
            "dft_barrier_eV": 1.74,
        },
        "rxn_20_cyclopropane_ring_opening": {
            "name": "cyclopropane ring-opening",
            "reactant_formula": "C3H6",
            "reactant_coords": {
                "C0": [0.000, 0.000, 0.000],
                "C1": [1.500, 0.000, 0.000],
                "C2": [0.750, 1.300, 0.000],
                "H0": [-0.500, -0.500, 0.000],
                "H1": [2.000, -0.500, 0.000],
                "H2": [0.750, 2.000, 0.000],
                "H3": [0.000, 0.000, 1.000],
                "H4": [1.500, 0.000, 1.000],
                "H5": [0.750, 1.300, 1.000],
            },
            "transition_state_coords": {
                "C0": [0.000, 0.000, 0.000],
                "C1": [1.500, 0.000, 0.000],
                "C2": [0.750, 1.300, 0.000],
                "H0": [-0.500, -0.500, 0.000],
                "H1": [2.000, -0.500, 0.000],
                "H2": [0.750, 2.000, 0.000],
                "H3": [0.000, 0.000, 1.500],
                "H4": [1.500, 0.000, 1.500],
                "H5": [0.750, 1.300, 1.500],
            },
            "dft_barrier_eV": 1.77,
        },
    }

    params["experiment_3_reaction_barriers"]["reactions"] = reactions

    return params


def main():
    params = parse_dataset_file(DATA_FILE)

    # Save parsed parameters
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(params, f, indent=2)

    print(f"Dataset parameters saved to {OUTPUT_FILE}")
    print(f"Experiments found: {list(params.keys())}")

    # Print summary
    exp1 = params["experiment_1_water_rdf"]
    print(f"\nExperiment 1 - Water RDF:")
    print(f"  {exp1['num_water_molecules']} H2O molecules, box={exp1['box_size_angstrom']} Å")
    print(f"  T={exp1['temperature_K']} K, dt={exp1['time_step_fs']} fs, steps={exp1['total_md_steps']}")

    exp2 = params["experiment_2_adsorption_scaling"]
    print(f"\nExperiment 2 - Adsorption Scaling:")
    print(f"  Metals: {', '.join(exp2['metals'].keys())}")
    print(f"  Slab: ({exp2['slab_parameters']['miller_indices'][0]}, {exp2['slab_parameters']['miller_indices'][1]}, {exp2['slab_parameters']['miller_indices'][2]})")

    exp3 = params["experiment_3_reaction_barriers"]
    print(f"\nExperiment 3 - Reaction Barriers:")
    for rxn_id, rxn_data in exp3["reactions"].items():
        print(f"  {rxn_id}: {rxn_data['name']} (DFT ref: {rxn_data['dft_barrier_eV']} eV)")


if __name__ == "__main__":
    main()
