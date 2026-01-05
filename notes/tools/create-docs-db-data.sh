#!/bin/bash

# Create Webseriously Docs
# Scans /notes/designs directory and generates Docs.ts for DB_Docs

cd /Users/sand/GitHub/webseriously

echo "Generating Docs.ts from /notes/designs structure..."

# Output file
OUTPUT="src/lib/ts/files/Docs.ts"

# Start writing the file
cat > "$OUTPUT" << 'EOF'
// Documentation structure for DB_Docs
// This represents the /notes/designs hierarchy
// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Run: bash notes/tools/create_docs_db_data.sh to regenerate

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
			echo "${indent}{" >> "$OUTPUT"
			echo "${indent}	id: '$id'," >> "$OUTPUT"
			echo "${indent}	name: '$name'," >> "$OUTPUT"
			echo "${indent}	type: 'folder'," >> "$OUTPUT"
			echo "${indent}	path: '$new_rel_path'," >> "$OUTPUT"
			
			# Add link to index.md if it exists in this folder
			if [[ -f "$full_path/index.md" ]]; then
				# Strip .md extension from link
				local link_path="${new_rel_path}/index"
				echo "${indent}	link: '$link_path'," >> "$OUTPUT"
			fi
			
			# Check if directory has children (excluding index.md)
			local has_children=$(find "$full_path" -maxdepth 1 \( -name "*.md" -o -type d \) ! -name ".*" ! -name "index.md" ! -name "node_modules" | wc -l)
			
			if [[ $has_children -gt 1 ]]; then
				echo "${indent}	children: [" >> "$OUTPUT"
				process_directory "$full_path" "${indent}		" "$new_rel_path"
				echo "${indent}	]" >> "$OUTPUT"
			fi
			
			if [[ "$is_last" == "true" ]]; then
				echo "${indent}}" >> "$OUTPUT"
			else
				echo "${indent}}," >> "$OUTPUT"
			fi
			
		elif [[ -f "$full_path" ]] && [[ "$entry" == *.md ]]; then
			# It's a markdown file
			# Strip .md extension from path
			local file_path="${new_rel_path%.md}"
			echo "${indent}{" >> "$OUTPUT"
			echo "${indent}	id: '$id'," >> "$OUTPUT"
			echo "${indent}	name: '$name'," >> "$OUTPUT"
			echo "${indent}	type: 'file'," >> "$OUTPUT"
			echo "${indent}	path: '$file_path'" >> "$OUTPUT"
			
			if [[ "$is_last" == "true" ]]; then
				echo "${indent}}" >> "$OUTPUT"
			else
				echo "${indent}}," >> "$OUTPUT"
			fi
		fi
	done
}

# Process the notes/designs directory
process_directory "notes/designs" "		" ""

# Close the file
cat >> "$OUTPUT" << 'EOF'
	];
}
EOF

echo "✅ Generated: $OUTPUT"
echo ""
echo "Structure includes:"
wc -l "$OUTPUT" | awk '{print "  " $1 " lines"}'
grep -c "type: 'file'" "$OUTPUT" | awk '{print "  " $1 " files"}'
grep -c "type: 'folder'" "$OUTPUT" | awk '{print "  " $1 " folders"}'
