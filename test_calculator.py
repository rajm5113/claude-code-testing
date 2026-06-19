import unittest
from calculator import add, subtract, multiply, divide, power, modulo, square_root

class TestCalculator(unittest.TestCase):

    # --- add ---
    def test_add_positive(self):
        self.assertEqual(add(3, 5), 8)

    def test_add_negative(self):
        self.assertEqual(add(-3, -5), -8)

    def test_add_mixed(self):
        self.assertEqual(add(-3, 5), 2)

    # --- subtract ---
    def test_subtract(self):
        self.assertEqual(subtract(10, 4), 6)

    def test_subtract_negative_result(self):
        self.assertEqual(subtract(4, 10), -6)

    # --- multiply ---
    def test_multiply(self):
        self.assertEqual(multiply(3, 4), 12)

    def test_multiply_by_zero(self):
        self.assertEqual(multiply(99, 0), 0)

    # --- divide ---
    def test_divide(self):
        self.assertEqual(divide(10, 2), 5)

    def test_divide_by_zero(self):
        with self.assertRaises(ValueError):
            divide(10, 0)

    # --- power ---
    def test_power(self):
        self.assertEqual(power(2, 8), 256)

    def test_power_zero(self):
        self.assertEqual(power(5, 0), 1)

    # --- modulo ---
    def test_modulo(self):
        self.assertEqual(modulo(10, 3), 1)

    def test_modulo_by_zero(self):
        with self.assertRaises(ValueError):
            modulo(10, 0)

    # --- square_root ---
    def test_square_root(self):
        self.assertEqual(square_root(144), 12)

    def test_square_root_zero(self):
        self.assertEqual(square_root(0), 0)

    def test_square_root_negative(self):
        with self.assertRaises(ValueError):
            square_root(-1)

if __name__ == "__main__":
    unittest.main()
