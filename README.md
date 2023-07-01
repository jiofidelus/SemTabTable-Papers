# SemTabTable-Papers
* This is a dataset of papers published by SemTab@ISWC, annotated using Open Research Knowledge Graph
* It is based on papers published by SemTab@ISWC since 2019
* We used the data augmentation technique to make it more larger for semantic table annotation (STA) tasks
* The target Knowledge Graph is **Open Research Knowledge Graph** [https://orkg.org/]

## Annotation tasks are:
This dataset involve all the annotation tasks proposed by SemTab 2023 [https://sem-tab-challenge.github.io/2023/]:
 * CEA: Cell Entity Annotation consisting of matching individual cells of the tables to entities from Knowledge Graph,
 * CTA: Column Type Annotation, consisting of assigning a semantic type (an ORKG class as fine-grained as possible) to a column
 * CPA: Column Property Annotation, consisting of assigning a Knowledge Graph property to the relationship between two columns
 * TTD: Table Topic Detection, consisting of assigning a Knowledge Graph class to a table

## SemTabTable-Papers construction
Picture of the pipeline and the code
[SemTabTable-Papers pipeline][images/pipeline.png]
* The figure above presents the pipeline we are using to get the papers, extract knowledge from them, organizing these knowledge
 into research contributions of the authors to the domain and comparing these contributions. Thereafter, to extract the knowledge ingested
into ORKG to build the dataset.
* All the papers published by SemTab@ISWC since 2019 were downloaded. Paper metadata were automatically extracted from these papers using ORKG and
  key-insights were extracted and ingested into ORKG. It should be noted that currently, the annotation is manual, given that automatic extraction
  of knowledge from scientific papers is known as a tedious tasks. Once extracted and organized using ORKG, these contributions are compared and
  comparisons tables are built from them. Once the comparisons tables are builts, the [/code](extraction code) is used to extract the knowledge extracted
  and tables are built from them. Given that we wanted a dataset for evaluating STA, we decided to augment the dataset with more data
* How you can use to annotate research papers is published xxxxx in our paper
* You can also annotate your research paper using Latex. See the work of xxxx
* For each table, we have applied a set of data augmentation techniques given by [/script/augment](\scripts\augment)
  `template.py` shows the augmentation technique that we applied on `templates` extracted from ORKG (you can find it under [\input_data\template\template_1](\input_data\template\template_1)
* Then, we have annomyzed the file names using `python UUID` as shown at [\script\reconcile](\script\reconcile), the output is presented [/tables](/benchmark/tables)

## SemTabTable-Papers and how to use
SemTabTable-Papers benchmark ([/SemTabTable-Papers/benchmark]) or [Zenodo](link2Zenodo) consists of xxx folders. If you have an STA system and you want to evaluate using SemTabTable-Papers, you should:
 * [/tables](benchmark/tables) xxx tables, constructed using SemTab papers + xxx augmented based on the collected data
 * [/targets](benchmark/targets):
    * SemTabTable-Papers_CEA_Targets.csv: list of the required cells to be annotated (CEA task)
    * SemTabTable-Papers_CTA_Targets.csv: list of the required columns to be annotated (CTA task)
    * SemTabTable-Papers_CPA_Targets.csv: list of the required properties to be annotated (CEA task)
    * SemTabTable-Papers_TTD_Targets.csv: list of the required tables to be annotated (CEA task)
  * [gt/](/benchmark/gt) (Ground truth):
    * contaains the actual solutions for the [/targets](/benchmark/targets) CEA, CTA, CPA and TTD
    
## Citation

```
@inproceedings{SemTabTable-Papers,
	title={{SemTabTable-Papers: a dataset of scientific papers published by SemTab@ISWC and annotated using Open Research Knowledge Graph}},
	author={Azanzi, Jiomekong and Allard, Oelen and Sanju, Tiwari and Söeren, Auer},
	booktitle={SemTab@ISWC, submitted},
	year={2023}
}

@dataset{SemTabTable-PapersDataset,
	title={SemTabTable-Papers benchmark},
	author={Azanzi, Jiomekong and Allard, Oelen and Sanju, Tiwari and Söeren, Auer},
	booktitle={SemTab@ISWC, submitted},
  month = {July},
	year={2023},
  publisher    = {Zenodo},
  version      = {v0.1\_2023},
  doi          = {=},
  url          = {}
}

```

## Paper on knowledge acquisition and organization using Open Research Knowledge Graph
* You can also consider the following papers

```
ORKG paper here
Olivier Karas paper here
```

## Acknowledgment
* The authors thank neuralearn.ai for the financial support of the code. We would like to especially thank Mr. Folefac Martins, the neuralearn.ai engineer who facilite the
  acquisition of the fund to build all the source code and make it open source.
* The tables provided in this work are based on real-world scholarly communication research, but have been adapted so that they can be used during the next editions of
  SemTab challenges. We provided in this dataset the tables that can be use in other xxx than the challenge.

* Any publication using this dataset needs to contain citations of the underlying datasets.

