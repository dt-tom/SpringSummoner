# Architecture

In order to build a scalable codebase Eric proposes we build like this:

1. Scenes go in `scenes/`. They are in charge of maintaining all game objects
   present in state when they're active.
1. Game objects (player, enemies, summons, etc.) go in another folder (`lib/`?)
   they maintain their own internal state. For example, a player stores its
   health and a summoned object stores its location. They don't maintain
   references to other game objects unless absolutely necessary, instead they
   maintain `update([some dependencies])` methods which can reference other
   game objects. For example, the player will need to check if it collides with
   any enemies and read the keyboard for movement.
1. The scene's `update()` is in charge of calling the update methods of each
   game object and passing their required dependencies. This should be
   straightforward as the scene stores all game objects.

This follows a simple, framework-less idea of dependency injection that will
make it possible to avoid problems initializing game objects but allow them to
depend on each other in complex ways.
