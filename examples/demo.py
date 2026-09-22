"""End-to-end demo of Kernel LDA on a non-linearly separable dataset.

Runs Kernel LDA (RBF kernel) and a linear-kernel baseline on the classic
"concentric circles" dataset, reports test accuracy for each, and saves a
figure that shows the raw data alongside the 1-D discriminant projection
learned by the RBF Kernel LDA.

Usage::

    python examples/demo.py [--output PATH]
"""

from __future__ import annotations

import argparse

import numpy as np

# Use a non-interactive backend so the demo works in headless environments.
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from sklearn.datasets import make_circles  # noqa: E402
from sklearn.model_selection import train_test_split  # noqa: E402

from kern_lda import KernelLDA  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default="kernel_lda_demo.png",
        help="Path to write the demo figure (default: kernel_lda_demo.png).",
    )
    parser.add_argument("--n-samples", type=int, default=600)
    parser.add_argument("--gamma", type=float, default=5.0)
    args = parser.parse_args()

    X, y = make_circles(
        n_samples=args.n_samples, factor=0.4, noise=0.08, random_state=0
    )
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=0
    )

    rbf = KernelLDA(kernel="rbf", gamma=args.gamma).fit(X_train, y_train)
    linear = KernelLDA(kernel="linear").fit(X_train, y_train)

    rbf_acc = rbf.score(X_test, y_test)
    linear_acc = linear.score(X_test, y_test)

    print("Kernel LDA demo on concentric circles")
    print("-" * 38)
    print(f"Training samples : {X_train.shape[0]}")
    print(f"Test samples     : {X_test.shape[0]}")
    print(f"RBF kernel  accuracy : {rbf_acc:.3f}")
    print(f"Linear kernel accuracy: {linear_acc:.3f}")

    # Project the full dataset onto the single RBF discriminant direction.
    projection = rbf.transform(X).ravel()

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))

    axes[0].scatter(X[:, 0], X[:, 1], c=y, cmap="coolwarm", s=15, edgecolor="k", linewidth=0.2)
    axes[0].set_title("Input data (not linearly separable)")
    axes[0].set_xlabel("x1")
    axes[0].set_ylabel("x2")
    axes[0].set_aspect("equal")

    for label, color in zip(np.unique(y), ["#3b4cc0", "#b40426"]):
        axes[1].hist(
            projection[y == label],
            bins=40,
            alpha=0.6,
            color=color,
            label=f"class {label}",
        )
    axes[1].set_title(
        f"RBF Kernel LDA projection\n(test acc {rbf_acc:.2f} vs linear {linear_acc:.2f})"
    )
    axes[1].set_xlabel("discriminant coordinate")
    axes[1].set_ylabel("count")
    axes[1].legend()

    fig.tight_layout()
    fig.savefig(args.output, dpi=120)
    print(f"\nSaved figure to {args.output}")


if __name__ == "__main__":
    main()
