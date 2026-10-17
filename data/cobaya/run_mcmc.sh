#!/bin/bash
# Run TEP-HC Cobaya MCMC

cd "$(dirname "$0")/../../TEP-HC"
cobaya-run data/cobaya/tep_cosmology.yaml
