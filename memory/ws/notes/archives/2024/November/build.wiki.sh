#! /bin/sh
cd .massivewikibuilder/massivewikibuilder
source venv/bin/activate
./mwb.py -c ../mwb.yaml -w ../.. -o ../output -t ../this-wiki-themes/basso --lunr
