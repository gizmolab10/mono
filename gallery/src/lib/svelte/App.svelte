<script lang='ts'>
  import { c, colors, hits, Point, S_Mouse } from '../ts/common/Core';
  import Main from './Main.svelte';

  const { w_background_color, w_accent_color, w_hover_color, w_text_color } = colors;

  // Whenever any of the four theme colors changes, push all four onto the page so
  // every stylesheet can read them as plain style names. gallery remembers no choice of
  // its own yet, so these are core's defaults.
  $effect(() => {
    c.configure_reactive_colors(
      $w_background_color,
      $w_accent_color,
      $w_hover_color,
      $w_text_color
    );
  });
</script>

<!-- The cursor is fed to the manager here and nowhere else: it asks which targets hold
     that point and hands the press to the one of highest precedence. A control that has
     moved over to it watches nothing itself. -->
<svelte:window
  onmousemove={(event) => hits.handle_mouse_movement_at(new Point(event.clientX, event.clientY))}
  onmousedown={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.down(event, null))}
  onmouseup={(event) => hits.handle_s_mouse_at(new Point(event.clientX, event.clientY), S_Mouse.up(event, null))} />

<Main />
