#!/bin/bash

# Read the files
DOC_CONTENT=$(cat doc-content.txt)
FORM_CONTENT=$(cat form-content.txt)

# Read refactored HTML
cp oasis-john-refactored.html oasis-john-complete.html

# Use awk to replace placeholders with actual content
awk -v doc="$DOC_CONTENT" -v form="$FORM_CONTENT" '
{
  if (index($0, "<!-- PLACEHOLDER: Copy document sections from original template here -->") > 0) {
    print doc
  } else if (index($0, "<!-- PLACEHOLDER: Copy form sections from original template here -->") > 0) {
    print form
  } else {
    print
  }
}' oasis-john-refactored.html > oasis-john-complete.html

echo "✅ Complete HTML created!"
