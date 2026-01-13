# Banner_Hideable Slot Refactor

How to use slots to make Banner_Hideable more flexible. Right now it wraps content but hard-codes the banner UI. We could let the parent control what goes in the banner.

## The Problem

Banner_Hideable does two things:
1. Shows/hides content based on detail panel state
2. Renders a banner with titles using Glows_Banner

The banner rendering is locked in. Can't customize it without editing Banner_Hideable. That's inflexible.

## Current Implementation

**Location:** `/src/lib/svelte/details/Banner_Hideable.svelte`

**How it works:**
```svelte
<Banner_Hideable t_detail={T_Detail.selection}>
  <!-- Content here gets wrapped -->
  <D_Selection />
</Banner_Hideable>
```

Inside Banner_Hideable:
```svelte
{#if s_banner_hideable?.hasBanner}
  <div class='banner'>
    <Glows_Banner
      titles={titles}
      width={k.width.details}
      toggle_hidden={toggle_hidden}
      banner_id={T_Detail[t_detail]}
      font_size={k.font_size.banners}
      isSelected={hideable_isVisible}
      height={g.glows_banner_height}/>
  </div>
{/if}
{#if hideable_isVisible}
  <div class='hideable'>
    <slot />  <!-- Content goes here -->
  </div>
{/if}
```

The banner is hardcoded. Always Glows_Banner with specific props.

## What Could Be Better

Use slots for BOTH the banner and the content. Let the parent decide what banner to show.

### Proposed Structure

```svelte
<Banner_Hideable t_detail={T_Detail.selection} {isVisible}>
  <svelte:fragment slot="banner" let:toggle let:isSelected>
    <Glows_Banner
      titles={['Selection', 'grabbed']}
      width={k.width.details}
      toggle_hidden={toggle}
      banner_id="selection"
      isSelected={isSelected}
      height={g.glows_banner_height}/>
  </svelte:fragment>
  
  <D_Selection />
</Banner_Hideable>
```

Or use a different banner:
```svelte
<Banner_Hideable t_detail={T_Detail.tags}>
  <svelte:fragment slot="banner" let:toggle let:isSelected>
    <CustomBanner 
      title="Tags" 
      onToggle={toggle}
      highlighted={isSelected}/>
  </svelte:fragment>
  
  <D_Tags />
</Banner_Hideable>
```

Or skip the banner entirely:
```svelte
<Banner_Hideable t_detail={T_Detail.header}>
  <D_Header />
</Banner_Hideable>
```

## What Would Occupy the Slot

**Banner slot content:** Whatever banner component you want
- Default: Glows_Banner (current behavior)
- Alternative: Simple text banner
- Alternative: Custom styled banner
- Alternative: Nothing (for D_Header which has no banner)

**Main slot content:** The detail panel component
- D_Selection
- D_Tags
- D_Traits
- D_Data
- D_Header
- etc.

## Who Provides the Slot Content

**Parent component** would be the Details panel container (probably in a parent Details.svelte or similar).

Current structure (guessing based on files):
```
Details.svelte
├── Banner_Hideable (t_detail=header)
│   └── D_Header
├── Banner_Hideable (t_detail=selection)
│   └── D_Selection
├── Banner_Hideable (t_detail=tags)
│   └── D_Tags
├── Banner_Hideable (t_detail=traits)
│   └── D_Traits
└── Banner_Hideable (t_detail=data)
    └── D_Data
```

With slots, the parent would explicitly provide banner content:
```svelte
<!-- In Details.svelte or similar -->
<Banner_Hideable t_detail={T_Detail.selection}>
  <Glows_Banner slot="banner" 
    titles={selection_titles}
    let:toggle
    let:isSelected
    toggle_hidden={toggle}
    isSelected={isSelected}
    {...banner_props} />
  <D_Selection />
</Banner_Hideable>
```

## Benefits

1. **Flexibility** - Parent can use any banner component
2. **Testability** - Can test Banner_Hideable with mock banners
3. **Reusability** - Banner_Hideable becomes a pure show/hide container
4. **Customization** - Different detail sections can have different banner styles

## Refactor Steps

### Phase 1: Add Slot Props

Update Banner_Hideable to expose toggle function and state:

```svelte
{#if s_banner_hideable?.hasBanner}
  <div class='banner'>
    <slot name="banner" 
      toggle={toggle_hidden} 
      isSelected={hideable_isVisible}
      titles={titles}>
      <!-- Fallback to current behavior -->
      <Glows_Banner {titles} {toggle_hidden} {...banner_props}/>
    </slot>
  </div>
{/if}
```

### Phase 2: Update One Consumer

Pick D_Selection, explicitly pass banner through slot:

```svelte
<Banner_Hideable t_detail={T_Detail.selection}>
  <Glows_Banner slot="banner" 
    let:toggle
    let:isSelected
    let:titles
    {titles}
    toggle_hidden={toggle}
    {isSelected}
    {...other_props}/>
  <D_Selection />
</Banner_Hideable>
```

### Phase 3: Update All Consumers

Convert all Banner_Hideable usages to explicit slot pattern.

### Phase 4: Remove Fallback

Once all consumers updated, remove the default Glows_Banner from Banner_Hideable.

## Migration Considerations

**Keep it working:** Use slot fallback so old code keeps working during migration:
```svelte
<slot name="banner" {...props}>
  <Glows_Banner {...props} />  <!-- Fallback -->
</slot>
```

**State management:** Banner_Hideable still manages:
- Show/hide state
- Title updates
- Visibility toggling

Parent just controls the visual presentation.

**Props vs slots:** Could also make banner a prop:
```svelte
<Banner_Hideable bannerComponent={Glows_Banner} {bannerProps}>
```

But slots are more idiomatic Svelte. More flexible too.

## Summary

Banner_Hideable wraps detail panel content with collapsible banners. Right now the banner is hardcoded. With slots, parents can customize or replace the banner entirely while keeping the show/hide logic centralized.

**Who provides slot content:** Parent component (Details.svelte or wherever Banner_Hideable is used)

**What goes in the slot:** Any banner component - typically Glows_Banner but could be custom

**Main benefit:** Separation of concerns - Banner_Hideable handles visibility logic, parent handles visual presentation
