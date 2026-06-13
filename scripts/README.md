# TEP-QF Scripts

## Full pipeline

```bash
python scripts/run_all.py
```

Runs symbolic derivations for quantum foundations (Dirac equation, Klein-Gordon, spin holonomy).

## Derivation modules

Individual derivations live in `scripts/derivations/`:
- `derive_klein_gordon.py` - HJ to Klein-Gordon
- `derive_dirac_limit.py` - Dirac operator as local tetrad representation
- `derive_spin_holonomy.py` - Spin-1/2 as temporal-orientation holonomy
- `sympy_audit.py` - Master audit (includes Audit A.4 disformal signpost)

Full disformal tensor audit (inverse metric, null-cone tilt, Christoffel symbols):
see TEP-KIN (Paper 25), `scripts/derivations/derive_disformal_kinematics.py`.

## Site build

```bash
cd site && npm ci && npm run build
```

Generates `23-TEP-QF-v0.2-Qatar.md` at the repository root.
