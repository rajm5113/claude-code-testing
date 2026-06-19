import math

def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

def power(a, b):
    return a ** b

def modulo(a, b):
    if b == 0:
        raise ValueError("Cannot modulo by zero")
    return a % b

def square_root(a):
    if a < 0:
        raise ValueError("Cannot take square root of a negative number")
    return math.sqrt(a)

def show_menu():
    print("\n=============================")
    print("       CALCULATOR MENU       ")
    print("=============================")
    print("  1. Add          (+)")
    print("  2. Subtract      (-)")
    print("  3. Multiply      (*)")
    print("  4. Divide        (/)")
    print("  5. Power         (**)")
    print("  6. Modulo        (%)")
    print("  7. Square Root   (sqrt)")
    print("  8. View History")
    print("  9. Clear History")
    print("  0. Quit")
    print("=============================")

def show_history(history):
    if not history:
        print("\n  No calculations yet.")
    else:
        print("\n--- Calculation History ---")
        for i, entry in enumerate(history, 1):
            print(f"  {i}. {entry}")
    print()

def calculator():
    history = []

    print("Welcome to the Advanced Calculator!")

    while True:
        show_menu()
        choice = input("Choose an option (0-9): ").strip()

        try:
            if choice == "0":
                print("Goodbye!")
                break

            elif choice in ("1", "2", "3", "4", "5", "6"):
                a = float(input("Enter first number: "))
                b = float(input("Enter second number: "))

                if choice == "1":
                    result = add(a, b)
                    expr = f"{a} + {b} = {result}"
                elif choice == "2":
                    result = subtract(a, b)
                    expr = f"{a} - {b} = {result}"
                elif choice == "3":
                    result = multiply(a, b)
                    expr = f"{a} * {b} = {result}"
                elif choice == "4":
                    result = divide(a, b)
                    expr = f"{a} / {b} = {result}"
                elif choice == "5":
                    result = power(a, b)
                    expr = f"{a} ** {b} = {result}"
                elif choice == "6":
                    result = modulo(a, b)
                    expr = f"{a} % {b} = {result}"

                print(f"\n  Result: {result}")
                history.append(expr)

            elif choice == "7":
                a = float(input("Enter number: "))
                result = square_root(a)
                expr = f"sqrt({a}) = {result}"
                print(f"\n  Result: {result}")
                history.append(expr)

            elif choice == "8":
                show_history(history)

            elif choice == "9":
                history.clear()
                print("\n  History cleared.")

            else:
                print("\n  Invalid option. Please choose 0-9.")

        except ValueError as e:
            print(f"\n  Error: {e}")

if __name__ == "__main__":
    calculator()
