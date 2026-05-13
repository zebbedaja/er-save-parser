// @ts-check

import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import prettierConfig from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default defineConfig(js.configs.recommended, tseslint.configs.recommended, prettierConfig)
