# Article Supplements and Scripts

This repository contains supplementary materials and scripts used in published
articles by Doran Gao. It serves as a centralized place to store reproducible
code, data helpers, and supporting artifacts referenced in those publications.

## Scope

- Supplementary code and scripts tied to specific publications
- Reproducible helpers, data munging, and analysis utilities
- Minimal standalone examples when needed for an article

## Suggested Structure

Each article can live in its own folder:

```
article-title-or-doi/
  README.md
  data/
  scripts/
  results/
```

## Notes

- Large datasets should be linked or stored externally.
- Add per-article instructions in each folder's `README.md`.

## Medium Articles

- [Neural Networks, GPT, AGI, and Embeddings: A Beginner’s Guide](https://medium.com/@dorangao/neural-networks-gpt-agi-and-embeddings-a-beginners-guide-78163c71352f)
  - [Simple Neural Network Demo](gpt/simple_nn_demo.ipynb)
  - [Text Embeddings Demo](gpt/text_embeddings_demo.ipynb)
