from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="ahlingo",
    version="0.1.0",
    author="Aoife Hughes",
    description="A comprehensive language learning and translation evaluation tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/ahughes/ahlingo",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Education",
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "kivy",
        "kivymd",
        "tqdm",
        "openai"
    ],
    entry_points={
        "console_scripts": [
            "ahlingo=AHLingo.run:main",
        ],
    },
    include_package_data=True,
    package_data={
        "AHLingo": [
            "database/*.db",
            "assets/*",
            "generation_data/*"
        ],
    },
)
