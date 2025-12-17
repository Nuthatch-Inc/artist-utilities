from src_py.greet import greet


def test_greet():
    assert greet("World") == "Hello, World!"
