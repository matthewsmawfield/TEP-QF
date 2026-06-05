#!/usr/bin/env python3
"""
TEP-QF Analysis Pipeline (Paper 23, Qatar)
==========================================
Symbolic derivation pipeline. Executes rigorous SymPy-based proofs
for the Hamilton-Jacobi tangent-limit derivation, Dirac operator collapse, and
spin holonomy derivations.

Usage:
    python scripts/run_all.py              # Run all steps
    python scripts/run_all.py --step 1   # Run specific step
    python scripts/run_all.py --audit    # Run SymPy audit only
"""

import sys
import json
import argparse
import logging
import traceback
from pathlib import Path
from datetime import datetime, timezone

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

# Step registry: (module_path, description, outputs)
STEP_REGISTRY = {
    1: ("derivations.derive_klein_gordon", "HJ -> Klein-Gordon symbolic proof", ["derivation_01_klein_gordon.json"]),
    2: ("derivations.derive_dirac_limit", "Dirac operator tetrad collapse", ["derivation_02_dirac_limit.json"]),
    3: ("derivations.derive_spin_holonomy", "Spin as temporal holonomy", ["derivation_03_spin_holonomy.json"]),
    4: ("derivations.sympy_audit", "Master SymPy audit & verification", ["sympy_audit.json"]),
}


def setup_logging():
    log_dir = PROJECT_ROOT / "logs"
    log_dir.mkdir(exist_ok=True)
    log_path = log_dir / "pipeline.log"

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)
    file_handler = logging.FileHandler(log_path, mode="w")
    file_handler.setLevel(logging.DEBUG)

    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    logger = logging.getLogger("tep-qf-pipeline")
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)
    logger.addHandler(file_handler)
    return logger, log_path


def run_step(step_num, logger):
    module_name, desc, expected_outputs = STEP_REGISTRY[step_num]
    logger.info("=" * 60)
    logger.info(f"Step {step_num}: {desc}")
    logger.info(f"Module: {module_name}")
    logger.info("=" * 60)

    try:
        module = __import__(module_name, fromlist=["main"])
        if hasattr(module, "main"):
            module.main()
        else:
            logger.warning(f"Module {module_name} has no main() function")
    except Exception as e:
        logger.error(f"Step {step_num} failed: {e}")
        logger.debug(traceback.format_exc())
        return False, str(e)

    # Verify expected outputs exist
    results_dir = PROJECT_ROOT / "results"
    missing = []
    for out_file in expected_outputs:
        out_path = results_dir / out_file
        if not out_path.exists():
            missing.append(str(out_file))

    if missing:
        logger.error(f"Missing expected outputs: {missing}")
        return False, f"Missing outputs: {missing}"

    logger.info(f"Step {step_num} completed successfully.")
    return True, None


def run_audit_only(logger):
    logger.info("=" * 60)
    logger.info("SymPy Audit Mode")
    logger.info("=" * 60)
    return run_step(4, logger)


def main():
    parser = argparse.ArgumentParser(description="TEP-QF Pipeline (Paper 23)")
    parser.add_argument("--step", type=int, help="Run specific step number")
    parser.add_argument("--start", type=int, default=1, help="Start from step")
    parser.add_argument("--stop", type=int, help="Stop at step")
    parser.add_argument("--audit", action="store_true", help="Run SymPy audit only")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    args = parser.parse_args()

    logger, log_path = setup_logging()
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    logger.info("=" * 60)
    logger.info("TEP-QF Analysis Pipeline (Paper 23, Qatar)")
    logger.info("=" * 60)
    logger.info("Symbolic derivation pipeline for TEP-QF")
    logger.info(f"Project root: {PROJECT_ROOT}")
    logger.info(f"Log file: {log_path}")

    (PROJECT_ROOT / "results").mkdir(exist_ok=True)

    if args.audit:
        success, err = run_audit_only(logger)
        sys.exit(0 if success else 1)

    steps = sorted(STEP_REGISTRY.keys())
    if args.step:
        if args.step not in STEP_REGISTRY:
            logger.error(f"Unknown step: {args.step}. Valid: {list(STEP_REGISTRY.keys())}")
            sys.exit(1)
        steps = [args.step]
    else:
        steps = [s for s in steps if args.start <= s <= (args.stop or max(steps))]

    logger.info(f"Running steps: {steps}")

    results = {}
    all_success = True
    for s in steps:
        success, err = run_step(s, logger)
        results[s] = {"success": success, "error": err}
        if not success:
            all_success = False
            logger.error(f"Step {s} failed. Stopping pipeline.")
            break

    # Write master pipeline results
    master = {
        "pipeline": "TEP-QF",
        "paper": "Paper 23 (Qatar)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "COMPLETE" if all_success else "FAILED",
        "steps_run": steps,
        "step_results": results,
        "log_file": str(log_path),
        "output_directory": str(PROJECT_ROOT / "results"),
    }
    with open(PROJECT_ROOT / "results" / "pipeline_results.json", "w") as f:
        json.dump(master, f, indent=2)

    logger.info("=" * 60)
    if all_success:
        logger.info("Pipeline complete. All steps succeeded.")
    else:
        logger.info("Pipeline completed with errors.")
    logger.info(f"Master results: {PROJECT_ROOT / 'results' / 'pipeline_results.json'}")
    logger.info("=" * 60)

    return 0 if all_success else 1


if __name__ == "__main__":
    sys.exit(main())
