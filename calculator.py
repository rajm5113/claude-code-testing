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

def calculator():
    print("Simple Calculator")
    print("-----------------")
    print("Operations: +  -  *  /")
    print("Type 'quit' to exit\n")

    while True:
        user_input = input("Enter calculation (e.g. 5 + 3): ").strip()

        if user_input.lower() == "quit":
            print("Goodbye!")
            break

        try:
            parts = user_input.split()
            if len(parts) != 3:
                print("Invalid format. Use: number operator number\n")
                continue

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
            else:
                print(f"Unknown operator: {op}\n")
                continue

            print(f"Result: {result}\n")

        except ValueError as e:
            print(f"Error: {e}\n")

if __name__ == "__main__":
    calculator()
