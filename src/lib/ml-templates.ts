import type { NotebookCellExport } from "./code-export";

export interface LabTemplate {
  id: string;
  name: string;
  badge: string;
  kernel: "python" | "r";
  description: string;
  packages: string[];
  script: string;
  cells: NotebookCellExport[];
}

export const LAB_TEMPLATES: LabTemplate[] = [
  {
    id: "py-data-science",
    name: "Python Data Science Starter",
    badge: "NumPy · Pandas",
    kernel: "python",
    description: "Statistical sampling, summary metrics, and multi-trial simulations in Python.",
    packages: ["numpy"],
    script: `import numpy as np

# Generate random sample
sample = np.random.normal(loc=50, scale=12, size=1000)
print(f"Sample size: {len(sample)}")
print(f"Mean       : {np.mean(sample):.3f}")
print(f"Std Dev    : {np.std(sample):.3f}")
print(f"Median     : {np.median(sample):.3f}")

trials = [int(np.random.randint(1, 100)) for _ in range(5)]
print("Simulated trials:", trials)
print("Max trial:", max(trials))
`,
    cells: [
      {
        id: "nb-ds-1",
        type: "markdown",
        content:
          "# Lab Notebook: Python Data Science\nWelcome to your browser notebook! Add code cells, execute calculations with NumPy, Pandas, Scikit-Learn & Matplotlib, or install packages with `!pip install <package>`.",
      },
      {
        id: "nb-ds-2",
        type: "code",
        content: `import numpy as np

# Generate random sample
sample = np.random.normal(loc=50, scale=12, size=1000)
print(f"Sample size: {len(sample)}")
print(f"Mean       : {np.mean(sample):.3f}")
print(f"Std Dev    : {np.std(sample):.3f}")
print(f"Median     : {np.median(sample):.3f}")`,
        executionCount: 1,
        outputs: ["Sample size: 1000\nMean       : 49.982\nStd Dev    : 12.045\nMedian     : 50.114\n"],
      },
      {
        id: "nb-ds-3",
        type: "markdown",
        content: "### Distribution Histogram (Matplotlib)\nRun the cell below to render an inline histogram plot:",
      },
      {
        id: "nb-ds-4",
        type: "code",
        content: `import matplotlib.pyplot as plt

plt.figure(figsize=(7, 4))
plt.hist(sample, bins=28, color="#189B9B", edgecolor="#071E5D", alpha=0.85)
plt.axvline(np.mean(sample), color="#81B825", linestyle="--", linewidth=2, label=f"Mean ({np.mean(sample):.1f})")
plt.title("Normal Distribution Sample (n=1,000)")
plt.xlabel("Value")
plt.ylabel("Frequency")
plt.legend()
plt.grid(alpha=0.25)
plt.show()`,
        executionCount: null,
        outputs: [],
      },
    ],
  },
  {
    id: "py-ml-classification",
    name: "AI/ML: Random Forest Classifier",
    badge: "scikit-learn · Matplotlib",
    kernel: "python",
    description:
      "Train a Random Forest model on clinical/botanical features with accuracy metrics and a feature importance chart.",
    packages: ["scikit-learn", "matplotlib", "numpy"],
    script: `import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# 1. Load dataset & split into train/test sets
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.25, random_state=42, stratify=iris.target
)

# 2. Train Random Forest Classifier
clf = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
clf.fit(X_train, y_train)

# 3. Evaluate predictions
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"=== Random Forest Test Accuracy: {acc * 100:.2f}% ===\\n")
print(classification_report(y_test, y_pred, target_names=iris.target_names))

# 4. Plot Feature Importances
importances = clf.feature_importances_
indices = np.argsort(importances)

plt.figure(figsize=(7, 4))
plt.barh([iris.feature_names[i] for i in indices], importances[indices], color="#189B9B")
plt.xlabel("Relative Feature Importance")
plt.title("Random Forest Feature Importance")
plt.grid(axis="x", alpha=0.3)
plt.tight_layout()
plt.show()
`,
    cells: [
      {
        id: "nb-rf-1",
        type: "markdown",
        content:
          "# AI & Machine Learning: Supervised Classification with `scikit-learn`\nThis notebook trains a **Random Forest Classifier**, evaluates precision/recall/F1 metrics, and visualizes feature importance using **Matplotlib**.",
      },
      {
        id: "nb-rf-2",
        type: "code",
        content: `import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.25, random_state=42, stratify=iris.target
)

clf = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
clf.fit(X_train, y_train)

y_pred = clf.predict(X_test)
print(f"Test Set Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%\\n")
print(classification_report(y_test, y_pred, target_names=iris.target_names))`,
        executionCount: null,
        outputs: [],
      },
      {
        id: "nb-rf-3",
        type: "markdown",
        content: "### Visualize Feature Importance\nRun the cell below to plot which features contributed most to the model's decisions:",
      },
      {
        id: "nb-rf-4",
        type: "code",
        content: `import matplotlib.pyplot as plt

importances = clf.feature_importances_
indices = np.argsort(importances)

plt.figure(figsize=(7, 3.8))
plt.barh([iris.feature_names[i] for i in indices], importances[indices], color="#189B9B", edgecolor="#071E5D")
plt.xlabel("Relative Importance Score")
plt.title("Random Forest — Feature Importance")
plt.grid(axis="x", alpha=0.3)
plt.tight_layout()
plt.show()`,
        executionCount: null,
        outputs: [],
      },
    ],
  },
  {
    id: "py-neural-network",
    name: "AI/ML: Neural Network (MLP)",
    badge: "Deep MLP · Loss Curve",
    kernel: "python",
    description:
      "Build and train a Multi-Layer Perceptron (MLP) neural network and plot its training convergence curve.",
    packages: ["scikit-learn", "matplotlib", "numpy"],
    script: `import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score

# 1. Generate non-linear synthetic dataset
X, y = make_moons(n_samples=600, noise=0.22, random_state=42)
X = StandardScaler().fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# 2. Configure Multi-Layer Perceptron Neural Network (2 hidden layers: 32 -> 16 neurons, ReLU)
mlp = MLPClassifier(
    hidden_layer_sizes=(32, 16),
    activation="relu",
    solver="adam",
    max_iter=250,
    random_state=42
)
mlp.fit(X_train, y_train)

# 3. Evaluate Neural Network
train_acc = accuracy_score(y_train, mlp.predict(X_train))
test_acc = accuracy_score(y_test, mlp.predict(X_test))
print(f"Neural Network Architecture : Input(2) -> Dense(32, ReLU) -> Dense(16, ReLU) -> Output(1)")
print(f"Epochs Completed            : {mlp.n_iter_}")
print(f"Final Training Loss         : {mlp.loss_:.4f}")
print(f"Training Accuracy           : {train_acc * 100:.2f}%")
print(f"Test Set Accuracy           : {test_acc * 100:.2f}%")

# 4. Plot Training Loss Curve & Decision Boundary
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

ax1.plot(mlp.loss_curve_, color="#189B9B", linewidth=2)
ax1.set_title("Neural Network Training Loss Curve")
ax1.set_xlabel("Epoch")
ax1.set_ylabel("Cross-Entropy Loss")
ax1.grid(alpha=0.3)

xx, yy = np.meshgrid(np.linspace(-2.5, 2.5, 120), np.linspace(-2.5, 2.5, 120))
Z = mlp.predict_proba(np.c_[xx.ravel(), yy.ravel()])[:, 1].reshape(xx.shape)
ax2.contourf(xx, yy, Z, levels=20, cmap="GnBu", alpha=0.6)
ax2.scatter(X_test[:, 0], X_test[:, 1], c=y_test, cmap="coolwarm", edgecolors="k", s=30)
ax2.set_title(f"Learned Decision Boundary (Test Acc: {test_acc*100:.1f}%)")
ax2.set_xlabel("Feature 1")
ax2.set_ylabel("Feature 2")

plt.tight_layout()
plt.show()
`,
    cells: [
      {
        id: "nb-nn-1",
        type: "markdown",
        content:
          "# Deep Feedforward Neural Network (`MLPClassifier`)\nTrain a Multi-Layer Perceptron with two hidden layers `(32, 16)` using ReLU activations and the Adam optimizer, then visualize the training loss curve and non-linear decision boundary.",
      },
      {
        id: "nb-nn-2",
        type: "code",
        content: `import numpy as np
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score

X, y = make_moons(n_samples=600, noise=0.22, random_state=42)
X = StandardScaler().fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

mlp = MLPClassifier(hidden_layer_sizes=(32, 16), activation="relu", solver="adam", max_iter=250, random_state=42)
mlp.fit(X_train, y_train)

print(f"Epochs trained    : {mlp.n_iter_}")
print(f"Final loss        : {mlp.loss_:.4f}")
print(f"Training accuracy : {accuracy_score(y_train, mlp.predict(X_train)) * 100:.2f}%")
print(f"Testing accuracy  : {accuracy_score(y_test, mlp.predict(X_test)) * 100:.2f}%")`,
        executionCount: null,
        outputs: [],
      },
      {
        id: "nb-nn-3",
        type: "code",
        content: `import matplotlib.pyplot as plt

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))

ax1.plot(mlp.loss_curve_, color="#189B9B", linewidth=2)
ax1.set_title("Adam Optimizer Loss Curve")
ax1.set_xlabel("Epoch")
ax1.set_ylabel("Loss")
ax1.grid(alpha=0.3)

xx, yy = np.meshgrid(np.linspace(-2.5, 2.5, 120), np.linspace(-2.5, 2.5, 120))
Z = mlp.predict_proba(np.c_[xx.ravel(), yy.ravel()])[:, 1].reshape(xx.shape)
ax2.contourf(xx, yy, Z, levels=20, cmap="GnBu", alpha=0.6)
ax2.scatter(X_test[:, 0], X_test[:, 1], c=y_test, cmap="coolwarm", edgecolors="k", s=30)
ax2.set_title("Learned Non-Linear Decision Boundary")

plt.tight_layout()
plt.show()`,
        executionCount: null,
        outputs: [],
      },
    ],
  },
  {
    id: "py-ng-regression",
    name: "AI/ML: Nigerian Campus Analytics & Regression",
    badge: "Pandas · Regression · KMeans",
    kernel: "python",
    description:
      "Regression and K-Means clustering on Nigerian student study hours, lab runs, and CGPA performance.",
    packages: ["pandas", "scikit-learn", "matplotlib", "numpy"],
    script: `import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.metrics import r2_score, mean_absolute_error

np.random.seed(42)
n = 150
study_hours = np.random.uniform(4, 28, n)
lab_runs = study_hours * 1.8 + np.random.normal(5, 4, n)
cgpa = np.clip(1.8 + 0.095 * study_hours + 0.015 * lab_runs + np.random.normal(0, 0.25, n), 1.5, 5.0)

df = pd.DataFrame({
    "Study_Hours_Weekly": np.round(study_hours, 1),
    "Lab_Code_Runs": np.round(lab_runs, 0),
    "CGPA_5_Scale": np.round(cgpa, 2),
})

print("=== Nigerian University Student Cohort Summary (5.0 CGPA Scale) ===")
print(df.describe().round(2))

# Fit Multiple Linear Regression
X = df[["Study_Hours_Weekly", "Lab_Code_Runs"]]
y = df["CGPA_5_Scale"]
reg = LinearRegression().fit(X, y)
preds = reg.predict(X)

print(f"\\nR² Score : {r2_score(y, preds):.3f}")
print(f"MAE      : {mean_absolute_error(y, preds):.3f} CGPA points")

# K-Means Clustering into 3 Performance Tiers
kmeans = KMeans(n_clusters=3, n_init=10, random_state=42)
df["Cluster"] = kmeans.fit_predict(X)

plt.figure(figsize=(7.5, 4.2))
scatter = plt.scatter(df["Study_Hours_Weekly"], df["CGPA_5_Scale"], c=df["Cluster"], cmap="viridis", s=45, alpha=0.85, edgecolors="k")
line_x = np.linspace(4, 28, 100)
line_y = reg.intercept_ + (reg.coef_[0] + reg.coef_[1] * 1.8) * line_x
plt.plot(line_x, np.clip(line_y, 1.5, 5.0), color="#d9534f", linewidth=2.2, linestyle="--", label="Regression Trendline")
plt.title("Nigerian Student Study Hours vs. CGPA (5.0 Scale)")
plt.xlabel("Weekly Lab & Study Hours")
plt.ylabel("CGPA (out of 5.00)")
plt.legend()
plt.grid(alpha=0.25)
plt.tight_layout()
plt.show()
`,
    cells: [
      {
        id: "nb-ng-1",
        type: "markdown",
        content:
          "# Nigerian Campus Data Science: CGPA Regression & K-Means Clustering\nAnalyze student study hours and GardiaLab coding activity against Nigeria's **5.00 CGPA scale** using `pandas`, `LinearRegression`, and `KMeans`.",
      },
      {
        id: "nb-ng-2",
        type: "code",
        content: `import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.metrics import r2_score, mean_absolute_error

np.random.seed(42)
n = 150
study_hours = np.random.uniform(4, 28, n)
lab_runs = study_hours * 1.8 + np.random.normal(5, 4, n)
cgpa = np.clip(1.8 + 0.095 * study_hours + 0.015 * lab_runs + np.random.normal(0, 0.25, n), 1.5, 5.0)

df = pd.DataFrame({
    "Study_Hours_Weekly": np.round(study_hours, 1),
    "Lab_Code_Runs": np.round(lab_runs, 0),
    "CGPA_5_Scale": np.round(cgpa, 2),
})

X = df[["Study_Hours_Weekly", "Lab_Code_Runs"]]
y = df["CGPA_5_Scale"]
reg = LinearRegression().fit(X, y)
preds = reg.predict(X)
df["Cluster"] = KMeans(n_clusters=3, n_init=10, random_state=42).fit_predict(X)

print(df.head(6))
print(f"\\nModel R² Score: {r2_score(y, preds):.3f} | Mean Absolute Error: {mean_absolute_error(y, preds):.3f}")`,
        executionCount: null,
        outputs: [],
      },
      {
        id: "nb-ng-3",
        type: "code",
        content: `import matplotlib.pyplot as plt

plt.figure(figsize=(7.5, 4.2))
plt.scatter(df["Study_Hours_Weekly"], df["CGPA_5_Scale"], c=df["Cluster"], cmap="viridis", s=45, edgecolors="k", alpha=0.85)
line_x = np.linspace(4, 28, 100)
line_y = reg.intercept_ + (reg.coef_[0] + reg.coef_[1] * 1.8) * line_x
plt.plot(line_x, np.clip(line_y, 1.5, 5.0), color="#d9534f", linewidth=2, linestyle="--", label="OLS Regression Fit")
plt.title("Weekly Study Hours vs. Student CGPA (5.0 Scale)")
plt.xlabel("Weekly Study & Lab Hours")
plt.ylabel("CGPA (5.0 Scale)")
plt.legend()
plt.grid(alpha=0.25)
plt.tight_layout()
plt.show()`,
        executionCount: null,
        outputs: [],
      },
    ],
  },
  {
    id: "py-nlp-sentiment",
    name: "AI/ML: NLP Sentiment Classifier",
    badge: "TF-IDF · Naive Bayes",
    kernel: "python",
    description:
      "Natural Language Processing (NLP) pipeline with TF-IDF vectorization and Multinomial Naive Bayes text classification.",
    packages: ["scikit-learn", "numpy"],
    script: `from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# Training corpus of student feedback
texts = [
    "The Python lab environment is fast and easy to use",
    "I love running machine learning models in the browser",
    "Great practical session and clear lecture notes",
    "Excellent coding examples and helpful feedback",
    "The internet connection dropped during the afternoon class",
    "I struggled to understand the matrix algebra assignment",
    "The dataset had missing values and caused errors",
    "Difficult exam questions and very short time limit",
]
labels = [1, 1, 1, 1, 0, 0, 0, 0]  # 1 = Positive, 0 = Needs Attention

# Build TF-IDF + Multinomial Naive Bayes NLP Pipeline
model = make_pipeline(TfidfVectorizer(ngram_range=(1, 2)), MultinomialNB())
model.fit(texts, labels)

# Test on new unseen feedback sentences
test_samples = [
    "The browser coding notebook makes Python very easy",
    "I had errors with the missing values in the assignment",
    "Great lecture and fast machine learning lab",
]

print("=== NLP Sentiment Predictions ===")
for sentence in test_samples:
    pred = model.predict([sentence])[0]
    prob = model.predict_proba([sentence])[0][pred]
    sentiment = "POSITIVE (+)" if pred == 1 else "NEEDS ATTENTION (-)"
    print(f"[{sentiment} | conf: {prob*100:.1f}%] -> \\"{sentence}\\"")
`,
    cells: [
      {
        id: "nb-nlp-1",
        type: "markdown",
        content:
          "# Natural Language Processing (NLP): Text Sentiment Classification\nBuild a `TfidfVectorizer` + `MultinomialNB` machine learning pipeline to classify text feedback.",
      },
      {
        id: "nb-nlp-2",
        type: "code",
        content: `from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

texts = [
    "The Python lab environment is fast and easy to use",
    "I love running machine learning models in the browser",
    "Great practical session and clear lecture notes",
    "Excellent coding examples and helpful feedback",
    "The internet connection dropped during the afternoon class",
    "I struggled to understand the matrix algebra assignment",
    "The dataset had missing values and caused errors",
    "Difficult exam questions and very short time limit",
]
labels = [1, 1, 1, 1, 0, 0, 0, 0]  # 1 = Positive, 0 = Needs Attention

model = make_pipeline(TfidfVectorizer(ngram_range=(1, 2)), MultinomialNB())
model.fit(texts, labels)

test_samples = [
    "The browser coding notebook makes Python very easy",
    "I had errors with the missing values in the assignment",
    "Great lecture and fast machine learning lab",
]

for sentence in test_samples:
    pred = model.predict([sentence])[0]
    prob = model.predict_proba([sentence])[0][pred]
    tag = "POSITIVE" if pred == 1 else "NEEDS ATTENTION"
    print(f"[{tag} - {prob*100:.1f}%] {sentence}")`,
        executionCount: null,
        outputs: [],
      },
    ],
  },
  {
    id: "r-stats-regression",
    name: "R Statistical Analysis & OLS Regression",
    badge: "R · Regression · Plots",
    kernel: "r",
    description: "Summary statistics, ordinary least squares regression, and diagnostic plots in R.",
    packages: [],
    script: `# Summary statistics on mtcars dataset
data(mtcars)
print(head(mtcars[, c("mpg", "wt", "hp", "qsec")]))
print(summary(mtcars$mpg))

# Fit Linear Regression Model
model <- lm(mpg ~ wt + hp, data = mtcars)
print(summary(model))

# Plot MPG vs Weight with Regression Line
plot(mtcars$wt, mtcars$mpg,
     pch = 19, col = "#189B9B",
     xlab = "Weight (1000 lbs)", ylab = "Miles Per Gallon (MPG)",
     main = "R Linear Regression: MPG vs Vehicle Weight")
abline(lm(mpg ~ wt, data = mtcars), col = "#071E5D", lwd = 2)
`,
    cells: [
      {
        id: "nb-r1",
        type: "markdown",
        content:
          "# Lab Notebook: R Statistical Analysis & Regression\nInteractive R notebook powered by WebR. Run statistics, regressions, inline plots, and download your workspace as **.RData**, **.rda**, **.R**, or **.ipynb**.",
      },
      {
        id: "nb-r2",
        type: "code",
        content: `# Summary statistics on mtcars dataset
data(mtcars)
head(mtcars[, c("mpg", "wt", "hp", "qsec")])
summary(mtcars$mpg)`,
        executionCount: 1,
        outputs: [],
      },
      {
        id: "nb-r3",
        type: "markdown",
        content:
          "### Linear Regression & Scatter Plot\nFit an ordinary least squares regression model of miles per gallon on weight and plot the regression line:",
      },
      {
        id: "nb-r4",
        type: "code",
        content: `model <- lm(mpg ~ wt, data = mtcars)
print(coef(model))
cat("R-squared:", summary(model)$r.squared, "\\n")

plot(mtcars$wt, mtcars$mpg,
     pch = 19, col = "#189B9B",
     xlab = "Weight (1000 lbs)", ylab = "Miles Per Gallon (MPG)",
     main = "MPG vs. Weight with OLS Trendline")
abline(model, col = "#071E5D", lwd = 2)`,
        executionCount: 2,
        outputs: [],
      },
    ],
  },
  {
    id: "r-ml-clustering",
    name: "R Machine Learning: K-Means & PCA",
    badge: "R · K-Means · PCA",
    kernel: "r",
    description: "Unsupervised K-Means clustering and Principal Component Analysis (PCA) on the Iris dataset.",
    packages: [],
    script: `data(iris)
features <- scale(iris[, 1:4])

# 1. K-Means Clustering (k = 3)
set.seed(42)
km <- kmeans(features, centers = 3, nstart = 20)
cat("Cluster sizes:", km$size, "\\n\\n")
print(table(Predicted_Cluster = km$cluster, Actual_Species = iris$Species))

# 2. Principal Component Analysis (PCA)
pca <- prcomp(features)
print(summary(pca))

plot(pca$x[, 1], pca$x[, 2],
     col = km$cluster + 1, pch = 19,
     xlab = "Principal Component 1", ylab = "Principal Component 2",
     main = "R K-Means Clusters Projected on PCA Axes")
`,
    cells: [
      {
        id: "nb-rml-1",
        type: "markdown",
        content:
          "# R Machine Learning: K-Means Clustering & PCA\nPerform unsupervised K-Means clustering and Principal Component Analysis (PCA) dimensionality reduction in R.",
      },
      {
        id: "nb-rml-2",
        type: "code",
        content: `data(iris)
features <- scale(iris[, 1:4])

set.seed(42)
km <- kmeans(features, centers = 3, nstart = 20)
print(table(Cluster = km$cluster, Species = iris$Species))

pca <- prcomp(features)
plot(pca$x[, 1], pca$x[, 2],
     col = km$cluster + 1, pch = 19,
     xlab = "PC1", ylab = "PC2",
     main = "K-Means Clustering on PCA Components")`,
        executionCount: null,
        outputs: [],
      },
    ],
  },
];

