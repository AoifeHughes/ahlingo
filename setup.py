from setuptools import setup, find_packages

setup(
    name='AHLingo',
    version='0.1',
    packages=find_packages(),
    install_requires=[
        'kivy',
    ],
    entry_points={
        'console_scripts': [
            'AHLingo=AHLingo.__main__:main'
        ]
    }
)
