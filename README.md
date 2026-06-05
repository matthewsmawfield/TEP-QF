# Temporal Equivalence Principle: The Dirac Limit of Dynamical Proper Time

**Status:** Preprint

## Abstract

Standard relativistic quantum mechanics, including the Klein–Gordon and Dirac equations, is recovered here as the screened, flat-frame tangent limit of a deeper dynamical proper-time phase transport governed by the Temporal Equivalence Principle (TEP). By treating proper time τ as a dynamical scalar field φ rather than a universal parameter, three foundational structures are derived and two are geometrically reinterpreted. (1) The phase action S = −mc² ∫ dτ̃ emerges as the primitive geometric driver, with mass appearing in the primitive action as the parameter governing the oscillator frequency, ω₀ = mc²/ℏ, modulated by the conformal factor in the causal matter metric g̃μν. (2) The Klein-Gordon equation is derived from the minimal geometric Lagrangian in the causal metric and verified via WKB / eikonal expansion; its eikonal limit recovers the g̃-Hamilton-Jacobi equation, not via operator substitution. (3) The Dirac operator is recovered as the local Clifford/tetrad representation in the isochronous background — it emerges in the limit where temporal shear Σμ and disformal coupling B(φ) are negligible. (4) Spin-1/2 is reinterpreted as temporal-orientation holonomy of the proper-time phase frame, and antimatter as reversed phase orientation on the second sheet of the two-sheeted temporal manifold. (5) The spinor structure of relativistic quantum mechanics may be reinterpreted geometrically: Dirac's 1928 spinor encoded temporal-orientation holonomy without access to a dynamical proper-time geometry. These results recover standard relativistic quantum mechanics as the screened tangent-space limit of the TEP causal geometry, in the regime where the temporal field is frozen and locally constant over the interaction scale; the saturation scale ρ_T ≈ 20 g/cm³ is empirically calibrated in TEP-UCD (Paper 6).

**Paper 23** in the Temporal Equivalence Principle series.  
DOI: [10.5281/zenodo.20572698](https://doi.org/10.5281/zenodo.20572698)

## Sections

1. Introduction: The Background-Dependency of Relativistic Quantum Theory
2. Proper-Time Phase Transport
3. The Dirac Operator as a Screened Limit
4. Spin and Antimatter as Geometric Orientations
5. Conclusion

## Repository Structure

- `site/components/` -- manuscript source (HTML)
- `scripts/` -- symbolic derivation pipeline (`scripts/derivations/sympy_audit.py`)

## Build

```bash
cd site && npm run build
```

## License

CC-BY-4.0