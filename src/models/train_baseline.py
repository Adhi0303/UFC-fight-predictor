import mlflow
import mlflow.sklearn

mlflow.set_tracking_uri("file:./mlruns")
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

print("Script started")


X, y = load_iris(return_X_y=True)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Data loaded")

with mlflow.start_run():

    print("MLflow run started")

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    print("Accuracy calculated")

    mlflow.log_param("n_estimators", 100)
    mlflow.log_param("max_depth", 5)

    mlflow.log_metric("accuracy", accuracy)

    print(f"Accuracy: {accuracy}")

print("Script completed")