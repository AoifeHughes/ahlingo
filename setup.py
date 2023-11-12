from setuptools import setup, find_packages

setup(
    name='AHLingo',
    version='0.1',
    packages=find_packages(),
    package_data={
        'AHLingo': ['assets/fonts/*.ttf'],
    },
    include_package_data=True,  # This line is necessary to include the specified package_data
    install_requires=[
        'kivy',
    ],
    entry_points={
        'console_scripts': [
            'AHLingo=AHLingo.__main__:main'
        ]
    }
)
