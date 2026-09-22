# Kern-LDA

Multiclass **Kernel Linear Discriminant Analysis** (Kernel Fisher Discriminant
Analysis / Generalized Discriminant Analysis) with a small, scikit-learn style
API.

Kernel LDA kernelizes Fisher's Linear Discriminant Analysis so it can find
non-linear discriminant directions — separating classes that are **not**
linearly separable in the original feature space.

## Installation

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Quick start

```python
from sklearn.datasets import make_circles
from kern_lda import KernelLDA

X, y = make_circles(n_samples=400, factor=0.4, noise=0.08, random_state=0)

model = KernelLDA(kernel="rbf", gamma=5.0).fit(X, y)
print("accuracy:", model.score(X, y))

# Project onto the learned discriminant direction(s)
Z = model.transform(X)
```

`KernelLDA` implements the standard estimator methods:

- `fit(X, y)` — learn discriminant directions from a kernel matrix.
- `transform(X)` — project data onto `n_classes - 1` discriminant coordinates.
- `predict(X)` — nearest-centroid classification in the projected space.
- `score(X, y)` — mean accuracy.

Any kernel supported by scikit-learn's `pairwise_kernels`
(`"rbf"`, `"linear"`, `"poly"`, `"sigmoid"`, ...) can be used.

## Demo

Run an end-to-end demo on concentric circles (a dataset linear methods can't
separate). It prints accuracy and writes a figure:

```bash
python examples/demo.py --output kernel_lda_demo.png
```

## Tests

```bash
pytest
```

## Project layout

```
kern_lda/            # library package
  kernel_lda.py      # KernelLDA implementation
examples/demo.py     # end-to-end demo (prints metrics, saves a plot)
tests/               # pytest suite
```
