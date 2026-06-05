"""
TEP publication figure style for manuscript pipeline figures.

Aligned with TEP-JWST / TEP-WB / TEP-EFA: serif typography, 300 DPI exports,
blue-slate data series, and manuscript CSS accent (#b43b4e) for contrast.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional, Tuple, Union

import matplotlib as mpl
import matplotlib.pyplot as plt

# Semantic palette (cross-paper convention)
COLORS = {
    "primary": "#1e3a8a",
    "accent": "#2563eb",
    "highlight": "#2563eb",
    "gray": "#64748b",
    "light_gray": "#cbd5e1",
    "success": "#60a5fa",
    "info": "#475569",
    "tep": "#2563eb",
    "gr": "#64748b",
    "observed": "#1e3a8a",
    "model": "#475569",
    "text": "#0f172a",
    "background": "#ffffff",
    "red": "#b43b4e",
    "significant": "#2563eb",
    "marginal": "#64748b",
    "null": "#94a3b8",
    "fit": "#b43b4e",
    "planck": "#395d85",
    "shoes": "#b43b4e",
    "lcdm": "#64748b",
}

FIG_SIZES = {
    "single_column": (3.5, 2.6),
    "double_column": (7.2, 4.5),
    "full_width": (10.0, 6.0),
    "web_standard": (7.5, 4.6),
    "web_tall": (7.5, 5.4),
    "web_two_panel": (7.5, 4.0),
    "web_quad": (7.5, 5.6),
}

# Backward compatibility: many steps use FIG_SIZE as a single tuple
FIG_SIZE: Tuple[float, float] = FIG_SIZES["full_width"]


def set_pub_style(scale: float = 1.0, dpi: int = 300, transparent: bool = False) -> None:
    """Apply TEP-wide matplotlib rcParams for publication and web manuscript figures."""
    plt.style.use("default")
    base_font = 11
    plt.rcParams.update(
        {
            "figure.figsize": FIG_SIZES["full_width"],
            "font.family": "serif",
            "font.serif": ["Times New Roman", "STIXGeneral", "DejaVu Serif", "serif"],
            "mathtext.fontset": "dejavuserif",
            "font.size": base_font * scale,
            "axes.labelsize": (base_font + 1) * scale,
            "axes.titlesize": (base_font + 2) * scale,
            "xtick.labelsize": (base_font - 1) * scale,
            "ytick.labelsize": (base_font - 1) * scale,
            "legend.fontsize": (base_font - 1) * scale,
            "figure.titlesize": (base_font + 3) * scale,
            "figure.dpi": dpi,
            "savefig.dpi": dpi,
            "savefig.transparent": transparent,
            "figure.facecolor": "white" if not transparent else "none",
            "axes.facecolor": "white" if not transparent else "none",
            "axes.edgecolor": "#475569",
            "axes.labelcolor": COLORS["text"],
            "xtick.color": COLORS["text"],
            "ytick.color": COLORS["text"],
            "text.color": COLORS["text"],
            "legend.frameon": True,
            "legend.framealpha": 0.9,
            "legend.facecolor": "white",
            "legend.edgecolor": "#cbd5e1",
            "savefig.facecolor": "white" if not transparent else "none",
            "savefig.edgecolor": "none",
            "axes.grid": True,
            "grid.color": "#cbd5e1",
            "grid.linestyle": "-",
            "grid.linewidth": 0.5,
            "grid.alpha": 0.35,
            "axes.linewidth": 1.0,
            "xtick.major.width": 1.0,
            "ytick.major.width": 1.0,
            "lines.linewidth": 2.0,
            "lines.markersize": 7,
            "text.usetex": False,
        }
    )
    mpl.rcParams["axes.prop_cycle"] = mpl.cycler(
        color=["#2563eb", "#64748b", "#60a5fa", "#1e3a8a", "#b43b4e"]
    )


def save_fig(
    fig,
    path: Union[str, Path],
    *,
    dpi: int = 300,
    tight: bool = True,
    close: bool = True,
    pad_inches: float = 0.05,
) -> Path:
    """Save a figure with consistent TEP export settings."""
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    kwargs = {"dpi": dpi, "facecolor": "white", "edgecolor": "none"}
    if tight:
        kwargs["bbox_inches"] = "tight"
        kwargs["pad_inches"] = pad_inches
    fig.savefig(out, **kwargs)
    if close:
        plt.close(fig)
    return out


def style_axes(ax, *, title: Optional[str] = None, xlabel: Optional[str] = None, ylabel: Optional[str] = None) -> None:
    """Apply consistent axis labels and light grid to a single axes."""
    if title:
        ax.set_title(title, pad=10)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)
    ax.grid(True, alpha=0.35)
