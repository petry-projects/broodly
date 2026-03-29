'use client';
import { vars } from 'nativewind';

/**
 * Broodly Design Token Configuration
 *
 * Color values are RGB triplets used with NativeWind vars().
 * Key values per CLAUDE.md design system:
 *   primary-500:    #D4880F  (Honey Amber)
 *   secondary-500:  #E8B931  (Pollen Gold)
 *   success-500:    #2D7A3A  (Leaf Green)
 *   warning-500:    #B8720A  (Dark Amber)
 *   error-500:      #A63D2F  (Deep Rust Red)
 *   info-500:       #4A90C4  (Sky Blue)
 *   typography-500: #6B7280  typography-800: #2C2C2C
 *   background-0:   #FFFFFF  background-50: #FDF6E8  background-100: #FAFAF7
 *   outline-200:    #E5E7EB
 */
/**
 * Raw token definitions exported for testing and programmatic access.
 * Keys are CSS custom property names, values are space-separated RGB triplets.
 */
export const lightTokens: Record<string, string> = {
    /* Primary — Honey Amber (key: #D4880F) */
    '--color-primary-0': '255 248 230',
    '--color-primary-50': '252 234 189',
    '--color-primary-100': '248 219 148',
    '--color-primary-200': '240 194 97',
    '--color-primary-300': '232 170 50',
    '--color-primary-400': '222 152 20',
    '--color-primary-500': '212 136 15' /* #D4880F */,
    '--color-primary-600': '185 118 10',
    '--color-primary-700': '158 100 8',
    '--color-primary-800': '125 79 6',
    '--color-primary-900': '95 60 5',
    '--color-primary-950': '65 41 3',

    /* Secondary — Pollen Gold (key: #E8B931) */
    '--color-secondary-0': '255 251 235',
    '--color-secondary-50': '253 244 205',
    '--color-secondary-100': '250 236 170',
    '--color-secondary-200': '246 222 120',
    '--color-secondary-300': '242 208 75',
    '--color-secondary-400': '238 197 50',
    '--color-secondary-500': '232 185 49' /* #E8B931 */,
    '--color-secondary-600': '205 163 38',
    '--color-secondary-700': '175 139 28',
    '--color-secondary-800': '140 111 20',
    '--color-secondary-900': '110 87 15',
    '--color-secondary-950': '80 63 10',

    /* Success — Leaf Green (key: #2D7A3A) */
    '--color-success-0': '232 245 233' /* #E8F5E9 */,
    '--color-success-50': '200 230 205',
    '--color-success-100': '170 215 178',
    '--color-success-200': '130 190 140',
    '--color-success-300': '95 165 108',
    '--color-success-400': '65 140 78',
    '--color-success-500': '45 122 58' /* #2D7A3A */,
    '--color-success-600': '38 105 50',
    '--color-success-700': '30 88 42',
    '--color-success-800': '22 70 33',
    '--color-success-900': '15 55 25',
    '--color-success-950': '10 40 18',

    /* Warning — Dark Amber (key: #B8720A) */
    '--color-warning-0': '255 243 224' /* #FFF3E0 */,
    '--color-warning-50': '252 230 192',
    '--color-warning-100': '248 215 155',
    '--color-warning-200': '240 192 105',
    '--color-warning-300': '220 165 55',
    '--color-warning-400': '200 140 20',
    '--color-warning-500': '184 114 10' /* #B8720A */,
    '--color-warning-600': '160 98 8',
    '--color-warning-700': '135 82 6',
    '--color-warning-800': '108 65 5',
    '--color-warning-900': '85 52 4',
    '--color-warning-950': '60 36 2',

    /* Error — Deep Rust Red (key: #A63D2F) */
    '--color-error-0': '254 226 226' /* #FEE2E2 */,
    '--color-error-50': '252 205 200',
    '--color-error-100': '248 180 172',
    '--color-error-200': '235 140 128',
    '--color-error-300': '215 105 88',
    '--color-error-400': '195 75 58',
    '--color-error-500': '166 61 47' /* #A63D2F */,
    '--color-error-600': '145 52 40',
    '--color-error-700': '122 42 32',
    '--color-error-800': '98 33 25',
    '--color-error-900': '78 26 20',
    '--color-error-950': '55 18 14',

    /* Info — Sky Blue (key: #4A90C4) */
    '--color-info-0': '227 242 253' /* #E3F2FD */,
    '--color-info-50': '200 225 245',
    '--color-info-100': '170 208 235',
    '--color-info-200': '135 185 220',
    '--color-info-300': '105 165 210',
    '--color-info-400': '80 150 202',
    '--color-info-500': '74 144 196' /* #4A90C4 */,
    '--color-info-600': '60 125 175',
    '--color-info-700': '48 105 152',
    '--color-info-800': '38 85 128',
    '--color-info-900': '28 68 105',
    '--color-info-950': '18 48 78',

    /* Typography (key-500: #6B7280, key-800: #2C2C2C) */
    '--color-typography-0': '255 255 255',
    '--color-typography-50': '245 245 245',
    '--color-typography-100': '229 231 235',
    '--color-typography-200': '209 213 219',
    '--color-typography-300': '176 180 188',
    '--color-typography-400': '148 153 163',
    '--color-typography-500': '107 114 128' /* #6B7280 */,
    '--color-typography-600': '82 88 100',
    '--color-typography-700': '60 64 75',
    '--color-typography-800': '44 44 44' /* #2C2C2C */,
    '--color-typography-900': '28 28 30',
    '--color-typography-950': '15 15 16',

    /* Background — Warm Wax (key-0: #FFFFFF, key-50: #FDF6E8, key-100: #FAFAF7) */
    '--color-background-0': '255 255 255' /* #FFFFFF */,
    '--color-background-50': '253 246 232' /* #FDF6E8 */,
    '--color-background-100': '250 250 247' /* #FAFAF7 */,
    '--color-background-200': '242 242 238',
    '--color-background-300': '230 230 225',
    '--color-background-400': '210 210 205',
    '--color-background-500': '185 185 180',
    '--color-background-600': '155 155 150',
    '--color-background-700': '120 120 115',
    '--color-background-800': '85 85 82',
    '--color-background-900': '55 55 53',
    '--color-background-950': '30 30 28',

    /* Semantic background tokens */
    '--color-background-error': '254 226 226' /* #FEE2E2 */,
    '--color-background-warning': '255 243 224' /* #FFF3E0 */,
    '--color-background-success': '232 245 233' /* #E8F5E9 */,
    '--color-background-info': '227 242 253' /* #E3F2FD */,
    '--color-background-muted': '243 244 246' /* #F3F4F6 */,

    /* Outline — Borders (key-200: #E5E7EB) */
    '--color-outline-0': '255 255 255',
    '--color-outline-50': '249 250 251',
    '--color-outline-100': '243 244 246',
    '--color-outline-200': '229 231 235' /* #E5E7EB */,
    '--color-outline-300': '209 213 219',
    '--color-outline-400': '176 180 188',
    '--color-outline-500': '148 153 163',
    '--color-outline-600': '107 114 128',
    '--color-outline-700': '75 85 99',
    '--color-outline-800': '55 65 81',
    '--color-outline-900': '38 42 51',
    '--color-outline-950': '20 22 28',

    /* Focus ring indicators */
    '--color-indicator-primary': '212 136 15',
    '--color-indicator-info': '74 144 196',
    '--color-indicator-error': '166 61 47',
};

export const config = {
  light: vars(lightTokens),
};
