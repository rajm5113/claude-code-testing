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

def calculator():
    print("Simple Calculator")
    print("-----------------")
    print("Operations: +  -  *  /  **  %  sqrt")
    print("Two-number: 5 + 3  |  Single-number: sqrt 9")
    print("Type 'quit' to exit\n")

    while True:
        user_input = input("Enter calculation: ").strip()

        if user_input.lower() == "quit":
            print("Goodbye!")
            break

        try:
            parts = user_input.split()

            if len(parts) == 2 and parts[0] == "sqrt":
                a = float(parts[1])
                result = square_root(a)
            elif len(parts) == 3:
                a = float(parts[0])
                op = parts[1]
                b = float(parts[2])

                if op == "+":
                    result = add(a, b)
                elif op == "-":
                    result = subtract(a, b)
                elif op == "*":
                    result = multiply(a, b)
                elif op == "/":
                    result = divide(a, b)
                elif op == "**":
                    result = power(a, b)
                elif op == "%":
                    result = modulo(a, b)
                else:
                    print(f"Unknown operator: {op}\n")
                    continue
            else:
                print("Invalid format. Use: number operator number  OR  sqrt number\n")
                continue

            print(f"Result: {result}\n")

        except ValueError as e:
            print(f"Error: {e}\n")

if __name__ == "__main__":
    calculator()
