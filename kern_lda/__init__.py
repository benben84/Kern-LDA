"""Kern-LDA: Kernel Linear Discriminant Analysis.

A small, dependency-light implementation of multiclass Kernel Fisher
Discriminant Analysis (also known as Generalized Discriminant Analysis)
with a scikit-learn style API.
"""

from .kernel_lda import KernelLDA

__all__ = ["KernelLDA"]
__version__ = "0.1.0"
