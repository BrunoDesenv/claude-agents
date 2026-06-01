# SOLID Principles — Code Review Reference

## S — Single Responsibility Principle
**Rule:** A class or function should have exactly one reason to change.

**Red flags in code review:**
- Class name contains "And", "Manager", "Handler" (GodObject smell)
- Method longer than 30 lines with multiple distinct operations
- A single file imports from 5+ unrelated modules
- Constructor accepts more than 4 dependencies

**How to identify:** Ask "what are the reasons this class could change?" If there are 2+, it violates SRP.

**Example violation:** `UserService` that both validates passwords AND sends emails AND logs activity.

---

## O — Open/Closed Principle
**Rule:** Software entities should be open for extension, closed for modification.

**Red flags:**
- `switch (type)` or long `if/else if` chains that must be edited to add new behavior
- A function with a `type` parameter that controls which code path runs
- Comments like `// add new payment method here`

**How to identify:** "To add a new X, how many existing files must change?" If > 1, probably OCP violation.

---

## L — Liskov Substitution Principle
**Rule:** Subclasses must be substitutable for their base types without altering program correctness.

**Red flags:**
- Overriding a method to throw `NotImplementedException`
- Subclass adding preconditions the base class didn't have
- Subclass returning a narrower type or null where base returned a value

---

## I — Interface Segregation Principle
**Rule:** No client should be forced to depend on interfaces it does not use.

**Red flags:**
- Interface with more than 5 methods
- Implementations that have empty/stub methods for methods they don't need
- Interface that serves both read and write clients

---

## D — Dependency Inversion Principle
**Rule:** Depend on abstractions, not concretions. High-level modules should not depend on low-level modules.

**Red flags:**
- `new ConcreteService()` instantiated inside business logic (should be injected)
- Hardcoded service URLs, connection strings, file paths inside domain classes
- `using/import` of infrastructure classes (DB, HTTP client) directly in domain/use-case layer
- Static method calls to concrete utilities from business logic

---

## Quick Severity Guide

| Violation | Severity in PLAN_REVIEW | Severity in DRIFT_REVIEW |
|-----------|------------------------|--------------------------|
| SRP (business logic + infra in same class) | HIGH | HIGH |
| DIP (new ConcreteClass() in domain) | HIGH | HIGH |
| OCP (switch on type that will grow) | MEDIUM | MEDIUM |
| LSP (throws in override) | HIGH | BLOCKING |
| ISP (fat interface) | LOW | LOW |
