---
name: refactor-dry
description: Use when the user asks for a DRY refactoring analysis without immediately changing code.
user-invocable: true
disable-model-invocation: true
---

Apply the DRY (Don't Repeat Yourself) principle to the existing code by identifying and extracting truly duplicated logic.

Do not create shared code if it results in overly complex abstractions, such as too many parameters, special cases, or extensive conditional logic.

Ensure that the final result remains readable, clear, and easy to follow, even after refactoring. Analyze whether the code can be made more modular and reusable.

Do not change any code yet.