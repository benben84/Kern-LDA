import numpy as np
import pytest
from sklearn.datasets import make_blobs, make_circles
from sklearn.model_selection import train_test_split

from kern_lda import KernelLDA


def test_transform_shape_defaults_to_n_classes_minus_one():
    X, y = make_blobs(n_samples=150, centers=3, n_features=5, random_state=0)
    model = KernelLDA(kernel="linear").fit(X, y)
    Z = model.transform(X)
    assert Z.shape == (150, 2)  # n_classes - 1


def test_linearly_separable_blobs_high_accuracy():
    X, y = make_blobs(n_samples=300, centers=3, cluster_std=1.0, random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )
    model = KernelLDA(kernel="linear").fit(X_train, y_train)
    assert model.score(X_test, y_test) > 0.9


def test_rbf_separates_nonlinear_circles():
    X, y = make_circles(n_samples=400, factor=0.4, noise=0.08, random_state=1)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=1
    )
    model = KernelLDA(kernel="rbf", gamma=5.0).fit(X_train, y_train)
    acc = model.score(X_test, y_test)
    assert acc > 0.9, f"RBF Kernel LDA accuracy too low: {acc}"


def test_linear_kernel_fails_where_rbf_succeeds_on_circles():
    X, y = make_circles(n_samples=400, factor=0.4, noise=0.08, random_state=2)
    linear = KernelLDA(kernel="linear").fit(X, y)
    rbf = KernelLDA(kernel="rbf", gamma=5.0).fit(X, y)
    assert rbf.score(X, y) > linear.score(X, y)


def test_predict_returns_original_labels():
    X, y = make_blobs(n_samples=100, centers=2, random_state=0)
    labels = np.array(["cat", "dog"])[y]
    model = KernelLDA(kernel="rbf", gamma=0.5).fit(X, labels)
    preds = model.predict(X)
    assert set(np.unique(preds)).issubset({"cat", "dog"})


def test_requires_two_classes():
    X = np.random.RandomState(0).randn(20, 3)
    y = np.zeros(20)
    with pytest.raises(ValueError):
        KernelLDA().fit(X, y)


def test_transform_before_fit_raises():
    with pytest.raises(RuntimeError):
        KernelLDA().transform(np.zeros((3, 2)))
