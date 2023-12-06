#!/bin/bash
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/alpaca_translation.txt "translation"
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/alpaca_comprehension.txt "comprehension"
