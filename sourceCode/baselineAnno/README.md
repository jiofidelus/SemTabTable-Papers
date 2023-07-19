# Baseline code for Semantic Table Annotation
To facilitate the annotation by users, we provided a baseline code that uses ORKG API for annotation of the benchmark.
It should be noted that this system consider only exact match and not all the errors that was introduced in the dataset.

<<<<<<< HEAD
# Baseline code for Semantic Table Annotation
To facilitate the annotation by users, we provided a baseline code that uses ORKG API for annotation of the benchmark.
It should be noted that this system consider only exact match and not all the errors that was introduced in the dataset.
=======
This is a baseline tool, which serves to get fast ORKG annotation for labels given as input.

## Run The Code

### Install python

You must install python in your computer, and have it runnabled from the command line. 

Recommended version **python 3.6+**

### Install dependencies

Run the command ```pip install -r requirements.txt``` in command line to install the dependencies

### Virtual environment
You can use a virtual environment.

Create and activate the virtual environment with the commands 

(Linux)
```console
python3 -m venv .env
source .env/bin/activate
```

Then run the command to install the dependencies.

### Run the code

Use the command
```python3 main.py <resources>```

#### Example 1
```console
python3 main.py orkg
```
Output
```console
 - Input : orkg 
        -> id = R3109, label = ORKG, link = https://orkg.org/resource/R3109
```
#### Example 2

```console
python3 main.py banana apple "magical bean"
```
Output
```console
 - Input : banana 
        -> id = PWC_BANANAS_MODEL, label = Bananas, link = https://orkg.org/resource/PWC_BANANAS_MODEL
 - Input : apple 
        -> id = R75046, label = Apple, link = https://orkg.org/resource/R75046
 - Input : magical bean 
        -> ----Not Found----
```
>>>>>>> cbbf0ef (The dataset and the source code)
