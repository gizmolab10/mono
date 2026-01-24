#! /bin/sh

cd ..
echo "building webseriously in: $(pwd)"
yarn run build >/dev/null 2>&1		# recreate dist
cd -
echo "compiling extractor in: $(pwd)"
tsc extractor.ts >/dev/null 2>&1
mv extractor.js ../dist/extractor.cjs
cd ../dist
echo "running extractor in: $(pwd)"
echo ++++++++++++++++++++++++++++++
node extractor.cjs
echo ++++++++++++++++++++++++++++++
rm extractor.* content.html index.html
cp ../bubble/webseriously.html index.html
