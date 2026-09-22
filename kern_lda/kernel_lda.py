"""Multiclass Kernel Linear Discriminant Analysis.

This module implements Kernel Fisher Discriminant Analysis (KFDA), the
kernelized generalization of Fisher's Linear Discriminant Analysis. By
operating on a kernel (Gram) matrix it can find non-linear discriminant
directions that separate classes which are not linearly separable in the
original feature space.

The public class :class:`KernelLDA` follows the scikit-learn estimator
conventions (``fit`` / ``transform`` / ``predict``) so it can be dropped
into existing pipelines.
"""

from __future__ import annotations

import numpy as np
from scipy.linalg import eigh
from sklearn.metrics.pairwise import pairwise_kernels


class KernelLDA:
    """Kernel Linear Discriminant Analysis.

    Parameters
    ----------
    kernel:
        Kernel to use. Any kernel accepted by
        :func:`sklearn.metrics.pairwise.pairwise_kernels` is valid
        (e.g. ``"rbf"``, ``"linear"``, ``"poly"``, ``"sigmoid"``).
    n_components:
        Number of discriminant directions to keep. Defaults to
        ``n_classes - 1``, which is the maximum number of informative
        directions Fisher discriminant analysis can produce.
    gamma, degree, coef0:
        Kernel-specific parameters forwarded to ``pairwise_kernels``.
    reg:
        Non-negative regularization added to the diagonal of the
        within-class scatter matrix to keep the generalized eigenproblem
        well conditioned.
    """

    def __init__(
        self,
        kernel: str = "rbf",
        n_components: int | None = None,
        gamma: float | None = None,
        degree: int = 3,
        coef0: float = 1.0,
        reg: float = 1e-3,
    ) -> None:
        self.kernel = kernel
        self.n_components = n_components
        self.gamma = gamma
        self.degree = degree
        self.coef0 = coef0
        self.reg = reg

    def _kernel_params(self) -> dict:
        return {
            "gamma": self.gamma,
            "degree": self.degree,
            "coef0": self.coef0,
        }

    def _get_kernel(self, X: np.ndarray, Y: np.ndarray | None = None) -> np.ndarray:
        return pairwise_kernels(
            X, Y, metric=self.kernel, filter_params=True, **self._kernel_params()
        )

    def fit(self, X: np.ndarray, y: np.ndarray) -> "KernelLDA":
        """Fit the model from training data ``X`` and labels ``y``."""
        X = np.asarray(X, dtype=float)
        y = np.asarray(y)
        if X.ndim != 2:
            raise ValueError("X must be a 2D array of shape (n_samples, n_features).")
        if X.shape[0] != y.shape[0]:
            raise ValueError("X and y must have the same number of samples.")

        classes, y_idx = np.unique(y, return_inverse=True)
        n_samples = X.shape[0]
        n_classes = classes.shape[0]
        if n_classes < 2:
            raise ValueError("KernelLDA requires at least two classes.")

        max_components = n_classes - 1
        n_components = self.n_components or max_components
        n_components = min(n_components, max_components)

        self.X_fit_ = X
        self.classes_ = classes

        K = self._get_kernel(X)  # (n, n)

        overall_mean = K.mean(axis=1)  # (n,)
        between = np.zeros((n_samples, n_samples))
        within = np.zeros((n_samples, n_samples))

        for c in range(n_classes):
            idx = np.where(y_idx == c)[0]
            n_c = idx.shape[0]
            K_c = K[:, idx]  # (n, n_c)
            class_mean = K_c.mean(axis=1)  # (n,)

            diff = class_mean - overall_mean
            between += n_c * np.outer(diff, diff)
            # Within-class scatter: K_c K_c^T - n_c * class_mean class_mean^T
            within += K_c @ K_c.T - n_c * np.outer(class_mean, class_mean)

        # Regularize the within-class scatter for numerical stability.
        within += self.reg * np.eye(n_samples)

        # Solve the generalized eigenproblem: between @ a = lambda * within @ a.
        eigvals, eigvecs = eigh(between, within)

        # eigh returns ascending eigenvalues; take the largest ones.
        order = np.argsort(eigvals)[::-1]
        top = order[:n_components]
        self.eigenvalues_ = eigvals[top]
        self.alphas_ = eigvecs[:, top]  # (n, n_components)

        # Precompute class centroids in the projected space for prediction.
        projections = K @ self.alphas_  # (n, n_components)
        self.centroids_ = np.vstack(
            [projections[y_idx == c].mean(axis=0) for c in range(n_classes)]
        )
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        """Project ``X`` onto the learned discriminant directions."""
        if not hasattr(self, "alphas_"):
            raise RuntimeError("This KernelLDA instance is not fitted yet.")
        X = np.asarray(X, dtype=float)
        K = self._get_kernel(X, self.X_fit_)  # (m, n)
        return K @ self.alphas_

    def fit_transform(self, X: np.ndarray, y: np.ndarray) -> np.ndarray:
        return self.fit(X, y).transform(X)

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Predict class labels for ``X`` using nearest-centroid in the
        projected discriminant space."""
        proj = self.transform(X)  # (m, n_components)
        # Squared Euclidean distance to each class centroid.
        dists = np.linalg.norm(
            proj[:, None, :] - self.centroids_[None, :, :], axis=2
        )
        nearest = np.argmin(dists, axis=1)
        return self.classes_[nearest]

    def score(self, X: np.ndarray, y: np.ndarray) -> float:
        """Return mean accuracy on the given test data and labels."""
        return float(np.mean(self.predict(X) == np.asarray(y)))
