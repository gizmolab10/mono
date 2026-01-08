#!/bin/bash

# Create Docs DB Data
# Scans a directory and generates a TypeScript file for documentation structure
#
# Usage: create-docs-db-data.sh [project-root]

PROJECT_ROOT="${1:-$(pwd)}"
cd "$PROJECT_ROOT" || exit 1

# Source project-specific config if it exists
CONFIG_FILE="notes/tools/config.sh"
[ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

# Defaults (can be overridden by config.sh)
DOCS_SOURCE_DIR="${DOCS_SOURCE_DIR:-notes}"
DOCS_OUTPUT="${DOCS_OUTPUT:-src/lib/ts/files/Docs.ts}"

echo "Generating Docs.ts from /$DOCS_SOURCE_DIR structure..."

# Create output directory if needed
mkdir -p "$(dirname "$DOCS_OUTPUT")"

# Start writing the file
cat > "$DOCS_OUTPUT" << 'EOF'
// Documentation structure for DB_Docs
// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Run: bash shared/tools/create-docs-db-data.sh to regenerate

export interface DocNode {
	id: string;
	name: string;
	type: 'folder' | 'file';
	path: string;
	link?: string;
	children?: DocNode[];
}

export function getDocsStructure(): DocNode[] {
	return [
EOF

# Function to process a directory recursively
process_directory() {
	local dir="$1"
	local indent="$2"
	local rel_path="$3"
	
	# Get all entries, sorted
	local entries=($(ls -1 "$dir" 2>/dev/null | sort))
	local entry_count=${#entries[@]}
	local current=0
	
	for entry in "${entries[@]}"; do
		# Skip hidden files and system files
		if [[ "$entry" == .* ]] || [[ "$entry" == "node_modules" ]] || [[ "$entry" == "index.md" ]]; then
			continue
		fi
		
		local full_path="$dir/$entry"
		local new_rel_path="$rel_path/$entry"
		
		# Remove leading slash
		new_rel_path="${new_rel_path#/}"
		
		# Generate ID from path (lowercase, replace / and special chars with _)
		local id=$(echo "$new_rel_path" | tr '[:upper:]' '[:lower:]' | sed 's/[/. -]/_/g' | sed 's/_md$//')
		
		# Format name (convert kebab-case to Title Case)
		local name=$(echo "$entry" | sed 's/\.md$//' | sed 's/[-_]/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1')
		
		current=$((current + 1))
		local is_last=$([[ $current -eq $entry_count ]] && echo "true" || echo "false")
		
		if [[ -d "$full_path" ]]; then
			# It's a directory
			echo "${indent}{" >> "$DOCS_OUTPUT"
			echo "${indent}	id: '$id'," >> "$DOCS_OUTPUT"
			echo "${indent}	name: '$name'," >> "$DOCS_OUTPUT"
			echo "${indent}	type: 'folder'," >> "$DOCS_OUTPUT"
			echo "${indent}	path: '$new_rel_path'," >> "$DOCS_OUTPUT"
			
			# Add link to index.md if it exists in this folder
			if [[ -f "$full_path/index.md" ]]; then
				local link_path="${new_rel_path}/index"
				echo "${indent}	link: '$link_path'," >> "$DOCS_OUTPUT"
			fi
			
			# Check if directory has children (excluding index.md)
			local has_children=$(find "$full_path" -maxdepth 1 \( -name "*.md" -o -type d \) ! -name ".*" ! -name "index.md" ! -name "node_modules" | wc -l)
			
			if [[ $has_children -gt 1 ]]; then
				echo "${indent}	children: [" >> "$DOCS_OUTPUT"
				process_directory "$full_path" "${indent}		" "$new_rel_path"
				echo "${indent}	]" >> "$DOCS_OUTPUT"
			fi
			
			if [[ "$is_last" == "true" ]]; then
				echo "${indent}}" >> "$DOCS_OUTPUT"
			else
				echo "${indent}}," >> "$DOCS_OUTPUT"
			fi
			
		elif [[ -f "$full_path" ]] && [[ "$entry" == *.md ]]; then
			# It's a markdown file
			local file_path="${new_rel_path%.md}"
			echo "${indent}{" >> "$DOCS_OUTPUT"
			echo "${indent}	id: '$id'," >> "$DOCS_OUTPUT"
			echo "${indent}	name: '$name'," >> "$DOCS_OUTPUT"
			echo "${indent}	type: 'file'," >> "$DOCS_OUTPUT"
			echo "${indent}	path: '$file_path'" >> "$DOCS_OUTPUT"
			
			if [[ "$is_last" == "true" ]]; then
				echo "${indent}}" >> "$DOCS_OUTPUT"
			else
				echo "${indent}}," >> "$DOCS_OUTPUT"
			fi
		fi
	done
}

# Process the source directory
process_directory "$DOCS_SOURCE_DIR" "		" ""

# Close the file
cat >> "$DOCS_OUTPUT" << 'EOF'
	];
}
EOF

echo "✅ Generated: $DOCS_OUTPUT"
echo ""
echo "Structure includes:"
wc -l "$DOCS_OUTPUT" | awk '{print "  " $1 " lines"}'
grep -c "type: 'file'" "$DOCS_OUTPUT" | awk '{print "  " $1 " files"}'
grep -c "type: 'folder'" "$DOCS_OUTPUT" | awk '{print "  " $1 " folders"}'
