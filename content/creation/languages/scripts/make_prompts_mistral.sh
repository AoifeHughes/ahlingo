#!/bin/bash
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/mistral_translation.txt "translation"
./prompt_maker.sh French English "beginner" topics.txt ./prompt_templates/mistral_comprehension.txt "comprehension"
