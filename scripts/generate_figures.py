#!/usr/bin/env python3
"""
TEP-QF Figure Generation
=========================
Generate publication-quality conceptual figures from symbolic derivation outputs.

Usage:
    python scripts/generate_figures.py

Outputs:
    results/figures/fig1_derivation_flow.png — Derivation pipeline overview
    results/figures/fig2_dirac_tetrad_collapse.png — Dirac operator degradation
    results/figures/fig3_spin_holonomy.png — Spin as temporal holonomy diagram
"""

import sys, json
from pathlib import Path
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))
from utils.plot_style import set_pub_style, save_fig

RESULTS_DIR = PROJECT_ROOT / "results"
FIGURES_DIR = RESULTS_DIR / "figures"
FIGURES_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path):
    with open(path) as f:
        return json.load(f)


def fig1_derivation_flow():
    """Figure 1: Visual summary of the three core derivations."""
    import matplotlib.pyplot as plt

    set_pub_style(scale=0.9, dpi=300)
    fig, ax = plt.subplots(figsize=(8.5, 5.0))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6)
    ax.axis("off")

    # Title
    ax.text(5, 5.6, "TEP-QF Symbolic Derivation Pipeline", fontsize=16,
            ha="center", va="center", fontweight="bold", color="#0f172a")

    # Boxes for each derivation
    boxes = [
        {"x": 1.5, "y": 3.5, "w": 2.2, "h": 1.2,
         "label": "Der. 1: HJ → Klein–Gordon",
         "detail": "Geometric stationarity\nof proper-time phase",
         "color": "#2563eb"},
        {"x": 5.0, "y": 3.5, "w": 2.2, "h": 1.2,
         "label": "Der. 2: Dirac Limit",
         "detail": "Tetrad collapse in\nisochronous limit",
         "color": "#1e3a8a"},
        {"x": 8.5, "y": 3.5, "w": 2.2, "h": 1.2,
         "label": "Der. 3: Spin Holonomy",
         "detail": "Temporal-orientation\nbundle holonomy",
         "color": "#b43b4e"},
    ]

    for b in boxes:
        rect = plt.Rectangle((b["x"] - b["w"]/2, b["y"] - b["h"]/2),
                              b["w"], b["h"], facecolor=b["color"],
                              alpha=0.12, edgecolor=b["color"],
                              linewidth=2, zorder=2)
        ax.add_patch(rect)
        ax.text(b["x"], b["y"] + 0.15, b["label"], fontsize=11,
                ha="center", va="center", fontweight="bold", color=b["color"])
        ax.text(b["x"], b["y"] - 0.25, b["detail"], fontsize=8,
                ha="center", va="center", color="#475569")

    # Arrows between boxes
    ax.annotate("", xy=(3.5, 3.5), xytext=(2.7, 3.5),
                arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.5))
    ax.annotate("", xy=(7.0, 3.5), xytext=(6.2, 3.5),
                arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.5))

    # Axioms box at top
    ax.text(5, 4.9, "Axioms:  A1  g̃_{μν} = A²(φ) g_{μν} + B(φ)∇_μφ∇_νφ    A2  A(φ)=exp(βφ/M_Pl)    A3  Σ_μ = ∇_μ ln A",
            fontsize=9, ha="center", va="center", color="#475569",
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#f1f5f9", edgecolor="#cbd5e1"))

    # Output box at bottom
    rect_out = plt.Rectangle((2.5, 1.5), 5.0, 0.9, facecolor="#f8fafc",
                              edgecolor="#1e3a8a", linewidth=2, zorder=2)
    ax.add_patch(rect_out)
    ax.text(5, 2.1, "Outputs", fontsize=11, ha="center", va="center",
            fontweight="bold", color="#1e3a8a")
    ax.text(5, 1.85, r"derivation_01_klein_gordon.{tex,json}   derivation_02_dirac_limit.{tex,json}   derivation_03_spin_holonomy.{tex,json}",
            fontsize=8, ha="center", va="center", color="#475569")

    # Vertical arrows to output
    for x in [2.5, 5.0, 7.5]:
        ax.annotate("", xy=(x, 2.45), xytext=(x, 2.9),
                    arrowprops=dict(arrowstyle="->", color="#64748b", lw=1.2))

    fig.tight_layout()
    save_fig(fig, FIGURES_DIR / "fig1_derivation_flow.png", pad_inches=0.1)
    print("  fig1_derivation_flow.png")


def fig2_dirac_tetrad_collapse():
    """Figure 2: Dirac operator degradation as B(φ) and Σ_μ vanish."""
    import matplotlib.pyplot as plt

    set_pub_style(scale=0.95, dpi=300)
    fig, ax = plt.subplots(figsize=(6.5, 4.0))

    # Parameter sweep: B(φ) from 0 to 1 (arbitrary units)
    B = np.linspace(0, 1, 200)
    # Tetrad fidelity ~ 1 / (1 + α B)  (qualitative model)
    alpha = 2.0
    fidelity = 1.0 / (1.0 + alpha * B)

    ax.plot(B, fidelity, "-", color="#1e3a8a", linewidth=2.5, label="Tetrad fidelity")
    ax.axhline(1.0, color="#64748b", linestyle="--", linewidth=1.2, label="Flat-space limit")
    ax.axvline(0.0, color="#b43b4e", linestyle="--", linewidth=1.2, label="Screened ($B \\to 0$)")

    ax.fill_between(B, fidelity, 1.0, alpha=0.15, color="#1e3a8a")

    ax.set_xlabel(r"Disformal coupling $B(\phi)$ (arb. units)", fontsize=12)
    ax.set_ylabel("Tetrad fidelity", fontsize=12)
    ax.set_title("Dirac Operator Degradation: $B(\\phi) \\to 0$ Recovery", fontsize=13)
    ax.set_xlim(-0.05, 1.0)
    ax.set_ylim(0, 1.1)
    ax.legend(loc="lower left", framealpha=0.95, fontsize=9)
    ax.grid(alpha=0.3)

    fig.tight_layout()
    save_fig(fig, FIGURES_DIR / "fig2_dirac_tetrad_collapse.png")
    print("  fig2_dirac_tetrad_collapse.png")


def fig3_spin_holonomy():
    """Figure 3: Spin as temporal-orientation holonomy."""
    import matplotlib.pyplot as plt

    set_pub_style(scale=0.9, dpi=300)
    fig, ax = plt.subplots(figsize=(6.0, 4.2))

    # Draw a circle representing the vortex core loop
    theta = np.linspace(0, 2 * np.pi, 300)
    r = 1.0
    x = r * np.cos(theta)
    y = r * np.sin(theta)

    ax.plot(x, y, "-", color="#1e3a8a", linewidth=2.5, zorder=3)

    # Phase arrows along the loop
    n_arrows = 8
    for i in range(n_arrows):
        t = i * 2 * np.pi / n_arrows
        arr_x = 1.15 * np.cos(t)
        arr_y = 1.15 * np.sin(t)
        dx = -0.15 * np.sin(t)
        dy = 0.15 * np.cos(t)
        ax.annotate("", xy=(arr_x + dx, arr_y + dy), xytext=(arr_x, arr_y),
                    arrowprops=dict(arrowstyle="->", color="#2563eb", lw=1.5),
                    zorder=4)

    # Core singularity
    ax.plot(0, 0, "o", color="#b43b4e", markersize=12, zorder=5)
    ax.text(0, 0, "  Core", fontsize=9, ha="left", va="center",
            color="#b43b4e", fontweight="bold", zorder=6)

    # Phase labels
    ax.text(1.35, 0, r"$+\\pi$", fontsize=10, ha="left", va="center", color="#475569")
    ax.text(-1.45, 0, r"$-\\pi$", fontsize=10, ha="right", va="center", color="#475569")
    ax.text(0, 1.35, r"$+\\pi/2$", fontsize=10, ha="center", va="bottom", color="#475569")
    ax.text(0, -1.35, r"$-\\pi/2$", fontsize=10, ha="center", va="top", color="#475569")

    ax.set_xlim(-1.6, 1.6)
    ax.set_ylim(-1.6, 1.6)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title("Spin-1/2 as Temporal-Orientation Holonomy", fontsize=14, pad=15)

    # Caption text
    ax.text(0, -1.75,
            r"$\\Delta \\phi = \\oint_C \\Sigma_\\mu \\, dx^\\mu = \\pm 4\\pi$  "
            r"$\\Rightarrow$  two orientations  $\\Rightarrow$  spin up / down",
            fontsize=10, ha="center", va="top", color="#475569")

    fig.tight_layout()
    save_fig(fig, FIGURES_DIR / "fig3_spin_holonomy.png", pad_inches=0.15)
    print("  fig3_spin_holonomy.png")


def main():
    print("=" * 60)
    print("TEP-QF Figure Generation")
    print("=" * 60)

    fig1_derivation_flow()
    fig2_dirac_tetrad_collapse()
    fig3_spin_holonomy()

    print(f"\nDone. Figures saved to {FIGURES_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
