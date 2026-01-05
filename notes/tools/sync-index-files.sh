#!/bin/bash

# Sync Index Files
# Creates/updates index.md files to list all subdirectories and files
#
# To prevent an index.md from being overwritten, add this comment:
#   <!-- @manual -->

DESIGNS_DIR="/Users/sand/GitHub/webseriously/notes/designs"

# Function to check if index.md is manually maintained
is_manual() {
    local file="$1"
    [ -f "$file" ] && grep -q '<!-- *@manual *-->' "$file" 2>/dev/null
}

# Function to convert kebab-case to Title Case
to_title_case() {
    echo "$1" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1'
}

# Function to extract existing custom content (everything before ## Contents/Sections/Topics)
extract_custom_content() {
    local index_file="$1"
    awk '
        /^## (Contents|Sections|Topics)/ { exit }
        { print }
    ' "$index_file"
}

# Function to generate/update index.md content for a directory
sync_index() {
    local dir="$1"
    local index_file="${dir}/index.md"
    local dir_name=$(basename "$dir")
    local title=$(to_title_case "$dir_name")
    
    # Always use title from directory name
    local title=$(echo "$dir_name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
    
    # Check if index.md exists and extract custom content (description only, not title)
    local custom_description=""
    if [ -f "$index_file" ]; then
        # Extract content after first # line but before ## Contents/Sections/Topics
        custom_description=$(awk '
            /^# / { next }  # Skip title line
            /^## (Contents|Sections|Topics)/ { exit }
            NF { print }  # Print non-empty lines
        ' "$index_file")
    fi
    
    # Start with title
    local content="# ${title}\n"
    
    # Add custom description if it exists
    if [ -n "$custom_description" ]; then
        content+="\n${custom_description}\n"
    fi
    
    content+="\n"
    
    # Collect subdirectories with index.md
    local subdirs=()
    for subdir in "$dir"/*/ ; do
        [ -d "$subdir" ] || continue
        local subdir_name=$(basename "$subdir")
        # Skip hidden directories
        [[ "$subdir_name" == .* ]] && continue
        if [ -f "${subdir}index.md" ]; then
            subdirs+=("$subdir_name")
        fi
    done
    
    # Collect markdown files
    local files=()
    for file in "$dir"/*.md ; do
        [ -f "$file" ] || continue
        local filename=$(basename "$file")
        # Skip index.md itself
        [ "$filename" = "index.md" ] && continue
        files+=("$filename")
    done
    
    # Only add Contents section if there are items
    if [ ${#subdirs[@]} -gt 0 ] || [ ${#files[@]} -gt 0 ]; then
        content+="## Contents\n\n"
        
        # Add subdirectories first
        for subdir in "${subdirs[@]}"; do
            # Convert to title case inline
            local subdir_title=$(echo "$subdir" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
            content+="- [${subdir_title}](./${subdir}/)\n"
        done
        
        # Add files
        for file in "${files[@]}"; do
            # Remove .md extension and convert to title case inline
            local file_title=$(echo "$file" | sed 's/\.md$//' | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
            content+="- [${file_title}](./${file})\n"
        done
    fi
    
    echo -e "$content" > "$index_file"
}

# Recursive function to process directories
process_directory() {
    local dir="$1"
    local dir_name=$(basename "$dir")
    local index_file="${dir}/index.md"
    
    # Check if manually maintained
    if is_manual "$index_file"; then
        echo "Skipping index.md in: $dir_name (marked @manual)"
    elif [ -f "$index_file" ]; then
        echo "Updating index.md in: $dir_name"
        sync_index "$dir"
    else
        echo "Creating index.md in: $dir_name"
        sync_index "$dir"
    fi
    
    # Process subdirectories
    for subdir in "$dir"/*/ ; do
        [ -d "$subdir" ] || continue
        local subdir_name=$(basename "$subdir")
        # Skip hidden directories
        [[ "$subdir_name" == .* ]] && continue
        process_directory "$subdir"
    done
}

echo "Syncing index.md files..."
echo ""

# Start from designs directory
process_directory "$DESIGNS_DIR"

echo ""
echo "✅ All index.md files synced!"
