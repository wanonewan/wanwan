// home.js — 桌面、Widget 与 iScreen 功能
// 依赖：db.js、main.js 必须先加载

var NON_PASSIVE_POINTER_OPTIONS = { passive: false }
var DOCUMENT_DRAG_POINTER_OPTIONS = { passive: false, capture: true }
var _homeWallpaperData = ''

// ===== 仅SVG图标（网易云音乐、信息） =====
var SVG_ICONS = {
  instagram: '<svg xmlns="http://www.w3.org/2000/svg" height="800" width="800" viewBox="-24 -24 719.788 719.788"><g fill="#100f0d"><path d="M335.895 0c-91.224 0-102.663.387-138.49 2.021-35.752 1.631-60.169 7.31-81.535 15.612-22.088 8.584-40.82 20.07-59.493 38.743-18.674 18.673-30.16 37.407-38.743 59.495C9.33 137.236 3.653 161.653 2.02 197.405.386 233.232 0 244.671 0 335.895c0 91.222.386 102.661 2.02 138.488 1.633 35.752 7.31 60.169 15.614 81.534 8.584 22.088 20.07 40.82 38.743 59.495 18.674 18.673 37.405 30.159 59.493 38.743 21.366 8.302 45.783 13.98 81.535 15.612 35.827 1.634 47.266 2.021 138.49 2.021 91.222 0 102.661-.387 138.488-2.021 35.752-1.631 60.169-7.31 81.534-15.612 22.088-8.584 40.82-20.07 59.495-38.743 18.673-18.675 30.159-37.407 38.743-59.495 8.302-21.365 13.981-45.782 15.612-81.534 1.634-35.827 2.021-47.266 2.021-138.488 0-91.224-.387-102.663-2.021-138.49-1.631-35.752-7.31-60.169-15.612-81.534-8.584-22.088-20.07-40.822-38.743-59.495-18.675-18.673-37.407-30.159-59.495-38.743-21.365-8.302-45.782-13.981-81.534-15.612C438.556.387 427.117 0 335.895 0zm0 60.521c89.686 0 100.31.343 135.729 1.959 32.75 1.493 50.535 6.965 62.37 11.565 15.68 6.094 26.869 13.372 38.622 25.126 11.755 11.754 19.033 22.944 25.127 38.622 4.6 11.836 10.072 29.622 11.565 62.371 1.616 35.419 1.959 46.043 1.959 135.73 0 89.687-.343 100.311-1.959 135.73-1.493 32.75-6.965 50.535-11.565 62.37-6.094 15.68-13.372 26.869-25.127 38.622-11.753 11.755-22.943 19.033-38.621 25.127-11.836 4.6-29.622 10.072-62.371 11.565-35.413 1.616-46.036 1.959-135.73 1.959-89.694 0-100.315-.343-135.73-1.96-32.75-1.492-50.535-6.964-62.37-11.564-15.68-6.094-26.869-13.372-38.622-25.127-11.754-11.753-19.033-22.943-25.127-38.621-4.6-11.836-10.071-29.622-11.565-62.371-1.616-35.419-1.959-46.043-1.959-135.73 0-89.687.343-100.311 1.959-135.73 1.494-32.75 6.965-50.535 11.565-62.37 6.094-15.68 13.373-26.869 25.126-38.622 11.754-11.755 22.944-19.033 38.622-25.127 11.836-4.6 29.622-10.072 62.371-11.565 35.419-1.616 46.043-1.959 135.73-1.959"/><path d="M335.895 447.859c-61.838 0-111.966-50.128-111.966-111.964 0-61.838 50.128-111.966 111.966-111.966 61.836 0 111.964 50.128 111.964 111.966 0 61.836-50.128 111.964-111.964 111.964zm0-284.451c-95.263 0-172.487 77.224-172.487 172.487 0 95.261 77.224 172.485 172.487 172.485 95.261 0 172.485-77.224 172.485-172.485 0-95.263-77.224-172.487-172.485-172.487m219.608-6.815c0 22.262-18.047 40.307-40.308 40.307-22.26 0-40.307-18.045-40.307-40.307 0-22.261 18.047-40.308 40.307-40.308 22.261 0 40.308 18.047 40.308 40.308"/></g></svg>',
  taobao: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M152.576516 353.144969 101.660339 431.755417l93.919704 58.484798c0 0 62.441122 32.166639 32.510667 92.543591C200.396439 639.892491 63.989249 764.94675 63.989249 764.94675l122.130018 76.718293c84.630942-184.571141 78.954477-159.973123 100.112212-226.370569 21.845792-67.429531 26.662187-119.205779-10.320847-156.876869C228.434739 410.425668 223.102301 405.953301 152.576516 353.144969z"></path><path d="M219.317991 323.558542c44.379641 0 80.33059-32.338653 80.33059-72.245926 0-40.251302-35.950949-72.589955-80.33059-72.589955-44.723669 0-80.502604 32.510667-80.502604 72.589955C138.987401 291.047875 174.594322 323.558542 219.317991 323.558542z"></path><path d="M944.873509 332.503276c0 0-26.662187-207.793046-478.199227-79.126491 19.437594-33.88678 28.554342-55.732572 28.554342-55.732572l-112.669242-31.994625c0 0-45.583739 149.652276-126.774399 219.317991 0 0 78.782463 45.755753 77.922392 44.379641 22.533848-22.705863 42.831514-45.755753 60.032925-68.117588 18.061482-8.084663 35.434907-15.48127 52.29229-22.361834-20.985721 37.843104-54.528473 94.607761-88.243239 130.386696l47.475895 41.971443c0 0 32.510667-31.478582 67.77356-69.149672l40.251302 0 0 69.837729-157.220897 0L356.069209 567.646565l157.220897 0 0 133.654964-6.020494-0.172014c-17.373425-0.860071-44.207626-3.78431-54.872501-20.641693-12.729044-20.641693-3.268268-57.968755-2.752226-81.19066l-108.540904 0-3.956325 2.236183c0 0-39.907274 179.410717 114.733412 175.454393 144.491853 3.956325 227.402654-40.767344 267.309928-71.55787l15.825298 59.516882 89.103309-37.67109-60.376953-148.620192L691.496724 601.533345l13.417101 50.744163c-18.233496 14.105157-39.73526 24.426004-62.613136 32.166639L642.300689 567.646565l153.264572 0 0-55.904586-153.264572 0 0-69.837729 153.780615 0 0-55.732572-273.502436 0c19.781623-24.25399 35.090879-46.44381 39.219217-60.376953l-47.819923-13.073072c204.696792-73.966068 318.742147-61.237023 317.882076 59.86091L831.860239 691.496724c0 0 12.040988 109.400974-112.497228 101.660339l-67.429531-14.621199-15.653284 64.505291c0 0 290.875861 83.942886 314.613808-141.395599C974.459936 476.307072 944.873509 332.503276 944.873509 332.503276z"></path></svg>',
  bookstore: '<svg viewBox="0 0 1026 1024" xmlns="http://www.w3.org/2000/svg"><path d="M981.931864 790.573146c3.078156 18.468938-0.513026 34.885772-11.286573 49.763527s-25.138277 23.599198-43.607215 26.677355l-110.813627 17.442886c-17.955912 3.078156-34.372745-0.513026-49.250501-11.286573-14.877756-10.773547-24.112224-25.138277-27.190381-43.607215L644.873747 233.426854c-1.026052-9.234469-0.513026-17.955912 1.539079-26.164329 2.052104-8.208417 5.643287-15.903808 10.773547-23.086172s11.286573-12.825651 18.981964-17.442886c7.695391-4.617234 15.903808-7.695391 25.138276-9.747495l109.787575-17.442886c18.468938-3.078156 34.885772 1.026052 49.763527 11.799599s23.599198 25.651303 26.677355 44.120241l94.396794 595.11022zM517.643287 135.438878c18.468938 0 34.372745 6.669339 47.198396 19.49499s19.49499 28.729459 19.49499 47.198397v616.657314c0 18.468938-6.669339 34.372745-19.49499 47.198397s-28.729459 19.49499-47.198396 19.49499H421.707415c-18.468938 0-34.372745-6.669339-47.198397-19.49499s-19.49499-28.729459-19.49499-47.198397V202.132265c0-18.468938 5.130261-34.372745 14.877756-47.198397 9.747495-12.825651 24.112224-19.49499 43.607214-19.49499h104.144289z m0 465.314629c6.156313 0 11.286573-3.078156 15.903807-8.721443s6.669339-12.825651 6.669339-20.521042c0-8.721443-2.052104-15.903808-6.669339-21.034068-4.104208-5.643287-9.747495-8.208417-15.903807-8.208417H421.707415c-6.156313 0-11.286573 2.56513-15.903808 8.208417-4.104208 5.643287-6.669339 12.825651-6.669338 21.034068 0 8.208417 2.052104 14.877756 6.669338 20.521042 4.104208 5.643287 9.747495 8.721443 15.903808 8.721443h95.935872z m0-117.482966c6.156313 0 11.286573-3.078156 15.903807-8.721443 4.104208-5.643287 6.669339-12.825651 6.669339-21.547094 0-8.721443-2.052104-15.903808-6.669339-21.034068s-9.747495-8.208417-15.903807-8.208417H421.707415c-6.156313 0-11.286573 2.56513-15.903808 8.208417-4.104208 5.643287-6.669339 12.825651-6.669338 21.034068 0 8.721443 2.052104 15.903808 6.669338 21.547094 4.104208 5.643287 9.747495 8.721443 15.903808 8.721443h95.935872zM227.783567 135.438878c18.468938 0 34.372745 6.669339 47.711423 19.49499 13.338677 12.825651 20.008016 28.729459 20.008016 47.198397v616.657314c0 18.468938-6.669339 34.372745-20.008016 47.198397-13.338677 12.825651-29.242485 19.49499-47.711423 19.49499H131.847695c-18.468938 0-34.372745-6.669339-47.711422-19.49499s-20.008016-28.729459-20.008016-47.198397V202.132265c0-18.468938 6.669339-34.372745 20.008016-47.198397s29.242485-19.49499 47.711422-19.49499h95.935872z m-92.344689 230.861723c-6.669339 0-12.312625 2.56513-16.416834 8.208417-4.104208 5.643287-6.669339 12.825651-6.669339 21.034068 0 8.208417 2.052104 14.877756 6.669339 20.521042 4.104208 5.643287 9.747495 8.721443 16.416834 8.721443h88.753507c6.669339 0 12.312625-3.078156 15.903807-8.721443 4.104208-5.643287 6.156313-12.825651 6.156313-20.521042 0-8.721443-2.052104-15.903808-6.156313-21.034068-4.104208-5.643287-9.234469-8.208417-15.903807-8.208417H135.438878z m92.344689 289.85972c6.669339 0 12.312625-2.56513 15.903808-8.208417s6.156313-12.312625 6.156312-20.521042c0-8.721443-2.052104-15.390782-6.156312-20.521042s-9.234469-7.695391-15.903808-7.695391h-92.344689c-6.669339 0-12.312625 2.56513-16.416834 7.695391-4.104208 5.130261-6.669339 12.312625-6.669339 20.521042s2.052104 14.877756 6.669339 20.521042c4.104208 5.643287 9.747495 8.208417 16.416834 8.208417h92.344689z m0-113.891784c6.669339 0 12.312625-2.56513 15.903808-8.208417 4.104208-5.643287 6.156313-12.825651 6.156312-21.034068s-2.052104-15.903808-6.156312-21.034068c-4.104208-5.643287-9.234469-8.208417-15.903808-8.208417h-92.344689c-6.669339 0-12.312625 2.56513-16.416834 8.208417-4.104208 5.643287-6.669339 12.825651-6.669339 21.034068s2.052104 15.903808 6.669339 21.034068c4.104208 5.643287 9.747495 8.208417 16.416834 8.208417h92.344689z"></path></svg>',
  music:   '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M623.61751703 18.30760297c26.82121482-7.73082075 55.55996445-7.34245925 82.64817779-1.11653927 31.10532741 7.39100445 60.53584592 21.67542518 85.86429629 41.14204445 9.24785778 7.02691555 17.59762963 15.76504889 21.84533334 26.76053333 6.57787259 16.26263703 4.81810963 35.7049837-4.89092742 50.35349334-8.47113482 13.15574518-22.87691852 22.31864889-38.39924148 24.28472888-12.40329482 1.69908148-25.40126815-0.93449482-36.0569363-7.5245037-6.00746667-3.53166222-10.58285037-8.98085925-16.61458962-12.47611259-16.17768297-10.26730667-34.80689778-18.35008-54.28565333-17.88890074-13.71401482 0.15777185-25.77749333 8.192-35.0738963 17.63403851-8.70172445 8.98085925-13.13147259 22.22155852-10.25517037 34.53989927 6.68709925 25.17067852 13.33778963 50.34135703 20.01275259 75.51203555 47.98691555 2.46366815 95.94955852 15.15823408 137.20082963 40.20754963 40.09832297 24.80658963 76.32516741 56.26386963 105.05178074 93.75288889 24.38181925 31.7728237 42.86539852 68.06034963 54.17642666 106.4838637 12.24552297 41.40904297 16.21409185 85.07543703 13.02224593 128.08647111-2.65784889 35.48653037-9.63621925 70.7667437-21.67542518 104.29933037-31.1296 81.65300148-88.7891437 153.24501333-163.00259555 199.64207408-54.43128889 34.38212741-116.94535111 55.12305778-180.69731556 63.03592297-44.00621037 5.49774222-88.84982518 5.52201482-132.63758222-1.9782163-89.97850075-14.86696297-174.30148741-59.71057778-238.29617778-124.48199112-63.59419259-63.71555555-107.85526518-146.41227852-125.75630222-234.6310163-13.20429037-64.33450667-12.60961185-131.50890667 2.03889778-195.55214221 17.90103703-78.97088 57.46536297-152.84451555 113.08600888-211.66914371 45.36547555-48.30245925 101.39875555-86.5196563 162.90550519-111.19274666 6.33514667-2.41512297 12.57320297-5.27928889 19.3209837-6.34728297 14.4057837-2.52434963 29.79460741 0.88594963 41.59108741 9.57553777 15.97136592 11.27461925 24.75804445 31.72427852 22.10019555 51.06953483-2.19666963 19.74575408-16.21409185 37.54970075-34.89185185 44.30961777-62.13783703 23.22887111-117.23662222 64.73500445-156.89803851 117.87984593-35.45012148 47.16164741-58.58190222 103.49833482-66.33699557 162.00741925-7.82791111 57.91440592-0.86167703 117.72207408 19.89138964 172.33540742 29.97665185 79.84469333 89.57800297 148.54826667 165.56335408 187.65141333 45.75383703 23.70218667 97.26027852 36.08120889 148.77885628 35.7292563 42.37994667-0.54613333 84.89339259-7.35459555 124.72471705-22.08805926 35.02535111-13.01010963 67.85403259-32.22186667 95.76751407-57.12554667 26.02021925-23.05896297 47.67137185-50.92389925 64.18887111-81.49522963 8.27695408-15.59514075 15.92282075-31.65146075 20.59529482-48.72722963 13.78683259-48.8121837 16.17768297-101.71429925 1.43208295-150.59930074-12.19697778-40.99640889-37.29483852-77.53879703-69.34679703-105.61005037-14.17519408-12.40329482-29.32129185-23.77500445-45.5596563-33.33840593-14.34510222-8.05850075-30.01306075-13.54410667-45.99656295-17.29422222 11.14112 43.5693037 23.05896297 86.95656297 34.35785481 130.48945778 1.91753482 10.43721482 3.83506963 20.87442963 5.63124147 31.33591704 1.6505363 44.91643259-14.1023763 90.16054518-43.07171555 124.5184-26.99112297 32.37963852-65.31754667 55.15946667-106.77513481 62.98737777-44.68584297 8.90804148-92.73344 0.49758815-131.10840889-24.27259259-36.63947852-23.22887111-63.70341925-60.01398518-77.9757037-100.73125926-8.08277333-22.77982815-12.1120237-46.8703763-12.91301927-70.99733334-2.45153185-52.48948148 11.27461925-106.11977482 41.2998163-149.53130666 35.28021333-51.80984889 90.90085925-87.42987852 150.53861926-104.80905482-4.39333925-16.79663408-8.88376889-33.56899555-13.32565334-50.36562963-11.51734518-36.25111703-9.06581333-76.95625482 8.11918223-111.03497481 9.27213037-19.0175763 23.05896297-35.58362075 39.0060563-49.35831703 17.75540148-15.18250667 38.48419555-27.17316741 61.08197925-33.38695111M481.22235259 413.16200297c-15.99563852 16.79663408-27.2095763 38.03515259-32.03982222 60.70575406-4.34479408 20.58315852-4.36906667 42.04013037-0.46117926 62.68397038 4.76956445 22.80410075 16.54177185 45.11061333 36.0569363 58.56976592 15.14609778 10.75275852 34.86757925 14.01742222 52.93852444 10.48576 33.4354963-5.87396741 60.71789037-36.63947852 61.65238518-70.68178963-1.27431111-8.43472592-2.66998518-16.86945185-5.04869925-25.07358815-12.48824889-47.23446518-25.08572445-94.43252148-37.50115556-141.69125925-28.25329778 8.71386075-55.14733037 23.39877925-75.59698963 45.00138667z"/></svg>',
  message: '<svg viewBox="0 0 1131 1024" xmlns="http://www.w3.org/2000/svg"><path d="M565.463579 0C253.143579 0 0 213.584842 0 476.267789c0 167.073684 104.394105 321.643789 274.539789 408.090948-22.204632 50.661053-55.888842 98.088421-98.627368 139.641263 83.806316-14.982737 162.762105-45.702737 230.130526-91.405474 51.738947 13.258105 106.010947 19.941053 160.282948 19.941053C878.645895 952.535579 1131.789474 738.896842 1131.789474 476.267789 1130.981053 213.584842 877.837474 0 565.463579 0z"/></svg>',
  visualnovel: '<svg viewBox="0 0 1154 1024" xmlns="http://www.w3.org/2000/svg"><path d="M385.260683 1024l-17.056996-1.175038c-31.953439-2.122648-63.679452-5.685665-94.419949-15.161774a301.757211 301.757211 0 0 1-52.004886-23.652367 264.042298 264.042298 0 0 1-50.185472-32.863146 158.213114 158.213114 0 0 1-16.185194-16.867474 41.694879 41.694879 0 0 1-9.05916-26.533105 123.341033 123.341033 0 0 1 9.097064-47.570066 353.345148 353.345148 0 0 1 35.630169-68.796551 1114.390404 1114.390404 0 0 1 99.878188-135.167217 732.541121 732.541121 0 0 1 135.697879-121.597429 578.080546 578.080546 0 0 1 80.812257-45.902271 17.246518 17.246518 0 0 1 15.427105-0.227427 79.864646 79.864646 0 0 1 22.287808 16.412621 263.2084 263.2084 0 0 1 40.860981 54.317056 587.51875 587.51875 0 0 1 69.137691 176.445147 298.876474 298.876474 0 0 1 7.6946 73.951554c-0.909706 27.404907-2.198457 54.809814-4.093679 82.176816a207.943733 207.943733 0 0 1-9.476109 51.777459 47.115213 47.115213 0 0 1-17.890893 24.599978 274.693444 274.693444 0 0 1-67.659418 34.113992 359.371953 359.371953 0 0 1-90.402078 19.369167c-9.589822 0.795993-19.217549 1.175038-28.845276 1.781508a16.033576 16.033576 0 0 0-2.350075 0.416949z M0.075809 578.812405c0.34114-3.790444 0.68228-7.201843 0.985515-10.802764a398.83047 398.83047 0 0 1 26.305678-111.439041 434.763875 434.763875 0 0 1 56.136469-104.313006 211.772081 211.772081 0 0 1 45.826463-47.039405 77.097622 77.097622 0 0 1 59.244633-13.607692 567.315686 567.315686 0 0 1 139.905271 42.111828 780.262805 780.262805 0 0 1 106.966317 56.629226 232.922756 232.922756 0 0 1 37.032634 28.200901 102.607307 102.607307 0 0 1 11.636661 13.986736 13.342361 13.342361 0 0 1 0.606471 14.896443 129.367838 129.367838 0 0 1-21.643432 28.579945 698.502938 698.502938 0 0 1-74.747547 66.82552 2076.215455 2076.215455 0 0 1-205.593658 144.036855c-15.161774 9.362396-30.096122 18.952218-45.485323 28.087186a162.155175 162.155175 0 0 1-47.380544 19.634498 60.874523 60.874523 0 0 1-35.668074-1.36456 53.975916 53.975916 0 0 1-25.358068-21.946668 151.162889 151.162889 0 0 1-19.558688-47.34264 309.944569 309.944569 0 0 1-8.831734-58.069595 19.444975 19.444975 0 0 0-0.454853-2.918642z M1154.000539 336.830489a450.001458 450.001458 0 0 1-18.080415 122.734562 551.016779 551.016779 0 0 1-76.22582 164.277823 359.068718 359.068718 0 0 1-41.96021 50.791944c-22.287808 22.325713-47.039404 41.164217-76.377438 53.331541a137.517292 137.517292 0 0 1-51.70165 11.901992 156.317892 156.317892 0 0 1-44.082859-6.33004 317.790787 317.790787 0 0 1-83.162331-38.662525 388.899508 388.899508 0 0 1-71.677288-60.154339 770.597174 770.597174 0 0 1-75.467731-90.288365 333.104179 333.104179 0 0 1-37.449582-63.300407 171.707093 171.707093 0 0 1-5.913092-18.307843 19.179644 19.179644 0 0 1 3.070259-16.336812 114.281873 114.281873 0 0 1 20.430491-22.742661 590.399488 590.399488 0 0 1 68.644933-52.535547c50.185473-33.848661 101.356461-66.14324 154.536383-95.102229a611.967111 611.967111 0 0 1 119.929634-50.640326 367.445598 367.445598 0 0 1 89.454468-15.161774 175.876581 175.876581 0 0 1 59.434155 6.254232c31.119542 9.589822 50.412899 30.740497 59.623677 61.594707a190.05284 190.05284 0 0 1 7.126034 50.564517c-0.075809 2.425884-0.151618 5.230812-0.151618 8.11155z M329.579067 164.630638c0.758089-26.040347 5.155003-48.290251 19.672402-67.5078a136.455968 136.455968 0 0 1 33.621234-30.816306 299.899894 299.899894 0 0 1 72.738612-34.113992 573.228778 573.228778 0 0 1 93.017485-22.742661q29.451746-4.738054 59.130919-7.959931a325.67491 325.67491 0 0 1 57.993786-0.379045 408.192866 408.192866 0 0 1 70.957104 11.030191 249.941848 249.941848 0 0 1 66.408571 25.737112 102.607307 102.607307 0 0 1 29.717077 24.865309 48.972531 48.972531 0 0 1 10.878573 41.0126 146.803879 146.803879 0 0 1-9.817249 30.323548 484.418686 484.418686 0 0 1-43.021534 75.391922 370.061004 370.061004 0 0 1-34.872081 47.039405 551.206301 551.206301 0 0 1-69.440926 62.504414q-37.904436 28.996893-76.756481 56.856653a217.078702 217.078702 0 0 1-54.392865 29.451747 72.20795 72.20795 0 0 1-21.52972 4.472723 58.410735 58.410735 0 0 1-28.314613-7.580887 284.017935 284.017935 0 0 1-51.474224-34.113992 394.660983 394.660983 0 0 1-103.74444-127.510521 175.990294 175.990294 0 0 1-18.686886-55.795329c-1.137133-7.770409-1.591986-15.275488-2.084744-20.16516z "/></svg>'
}

// 同人文站图标：白底红字 AO3（自绘，没有使用任何官方图片）
SVG_ICONS.ao3 = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="64" text-anchor="middle" font-family="Verdana, Georgia, sans-serif" font-weight="900" font-size="38" fill="#990000">AO3</text></svg>'

// ===== 桌面图标配置 =====
var DESKTOP_ICONS = [
  { id: 'wechat',    fa: 'fa-brands fa-weixin',         label: '微信',     action: function() { window.showWechatPage && showWechatPage() } },
  { id: 'character', fa: 'fa-solid fa-folder-closed',   label: '角色档案', action: function() { window.showCharacterPage && showCharacterPage() } },
  { id: 'lorebook',  fa: 'fa-solid fa-earth-americas',  label: '世界书',   action: function() { window.showLorebookPage && showLorebookPage() } },
  { id: 'phone',     fa: 'fa-brands fa-chrome',         label: '查看记录', action: function() { window.showPhonePage && showPhonePage() } },
  { id: 'music',     svg: SVG_ICONS.music,              label: '网易云音乐', action: function() { window.showMusicPage && showMusicPage() } },
  { id: 'icity',     fa: 'fa-solid fa-feather-pointed', label: 'iCity',    action: function() { window.showICityPage && showICityPage() } },
  { id: 'twitter',   fa: 'fa-brands fa-x-twitter',      label: 'X',        action: function() { window.showXPage && showXPage() } },
  { id: 'instagram', svg: SVG_ICONS.instagram,          label: 'Instagram', action: function() { window.showIGPage && showIGPage() } },
  { id: 'miss-you',  fa: 'fa-solid fa-fire-flame-curved', label: '想见你',  action: function() { window.showMissYouPage && showMissYouPage() } },
  { id: 'memory',    fa: 'fa-brands fa-deezer',         label: '记忆',     action: function() { window.showMemoryPage && showMemoryPage() } },
  { id: 'wallet',    fa: 'fa-brands fa-apple-pay',      label: '钱迹',     action: function() { window.showWalletApp && showWalletApp() } },
  { id: 'taobao',    svg: SVG_ICONS.taobao,             label: '淘宝',     action: function() { window.showTaobaoPage && showTaobaoPage() } },
  { id: 'bookstore', svg: SVG_ICONS.bookstore,          label: 'Readen', action: function() { window.showBookstorePage && showBookstorePage() } },
  { id: 'yumyum',    fa: 'fa-solid fa-drumstick-bite',  label: 'YumYum',   action: function() { window.showYumYumPage && showYumYumPage() } },
  { id: 'anyDoor',   fa: 'fa-solid fa-cubes',           label: '任意门',   action: function() { window.showAnyDoorPage && showAnyDoorPage() } },
  { id: 'gameHall',  fa: 'fa-solid fa-dice',            label: '游戏大厅', action: function() { window.showGameHallPage && showGameHallPage() } }
]

var DESKTOP_PAGE2_ICONS = [
  { id: 'tutorial', img: 'img/wanwan.png', label: '教程', action: function() { window.showTutorialPage && showTutorialPage() } },
{ id: 'loveDiary', fa: 'fa-solid fa-heart-pulse', label: '恋爱记', action: function() { window.showLoveDiaryPage ? window.showLoveDiaryPage() : window.toast('恋爱记文件没加载') } },
  { id: 'wanwanFarm', fa: 'fa-solid fa-seedling', label: '弯弯农场', action: function() {} },
  { id: 'visualnovel', svg: SVG_ICONS.visualnovel, label: '橙光', action: function() { window.showAvgPage && showAvgPage() } },
  { id: 'terminal', fa: 'fa-solid fa-terminal', label: '终端', action: function() { window.showTerminalPage && showTerminalPage() } },
  { id: 'ao3', svg: SVG_ICONS.ao3, label: '同人文站', action: function() { window.showAo3Page ? window.showAo3Page() : window.toast('同人文站文件没加载') } }
]

var DESKTOP_ICON_PAGES = [DESKTOP_ICONS, DESKTOP_PAGE2_ICONS]
var DOCK_ICONS = [
  { id: 'settings', fa: 'fa-solid fa-gear', label: '设置', action: function() { window.showSettingsPage && showSettingsPage() } },
  { id: 'iscreens', fa: 'fa-solid fa-wand-magic-sparkles', label: 'iScreens', action: function() { window.showiScreenPage && showiScreenPage() } },
  { id: 'message', svg: SVG_ICONS.message, label: '信息', action: function() { window.showMessagePage && showMessagePage() } }
]
var DESKTOP_ICON_CUSTOM_KEY = 'desktopIconCustomizations'
var DESKTOP_LABEL_COLOR_KEY = 'desktopLabelColor'
var DESKTOP_LAYOUT_KEY = 'desktopLayout'
var DESKTOP_WIDGETS_KEY = 'desktopWidgets'
var DESKTOP_WALLPAPER_KEY = 'wallpaperData'
var ISCREEN_BACKUP_TYPE = 'wanwan-iscreen'
var DESKTOP_GRID_COLS = 4
var DESKTOP_DEFAULT_ROWS = 3
var DOCK_MAX_ICONS = 4
var EDIT_LONG_PRESS_MS = 460
var DESKTOP_EDGE_SWITCH_MS = 520
var DEFAULT_DESKTOP_ICON_COLOR = '#787878'
var _desktopIconCustomizations = {}
var _desktopLabelColor = ''
var _desktopWidgets = []
var _desktopLayout = null
var _desktopGridRows = DESKTOP_DEFAULT_ROWS
var _desktopSlotsPerPage = DESKTOP_GRID_COLS * DESKTOP_DEFAULT_ROWS
var _desktopEditing = false
var _desktopDrag = null
var _desktopEdgeTimer = null
var _desktopPointerDown = null
var _desktopResizeBound = false

function getDesktopIconRegistry() {
  var registry = {}
  DESKTOP_ICON_PAGES.concat([DOCK_ICONS]).forEach(function(group) {
    group.forEach(function(item) {
      registry[item.id] = item
    })
  })
  _desktopWidgets.forEach(function(widget) {
    registry[widget.id] = widget
  })
  return registry
}

var DESKTOP_WIDGET_TEMPLATES = [
  {
    id: 'top',
    title: '消息通知',
    subtitle: '4x1',
    cols: 4,
    rows: 1,
    className: 'top-widget',
    data: { title: '@WanWan.zzz', subtext: '某年某月某个星期几', avatar: 'img/ava-00.jpg' }
  },
  {
    id: 'text-mood',
    title: '今日心情',
    subtitle: '4x1',
    cols: 4,
    rows: 1,
    className: 'text-mood-widget',
    data: { title: '💭·🍶날씨가 추워.', subtext: '萌萌之中早已注定' }
  },
  {
    id: 'chat-bubble',
    title: '对话气泡',
    subtitle: '4x1',
    cols: 4,
    rows: 1,
    className: 'chat-bubble-widget',
    data: { right: '我讨厌你', left: '我知道，我也爱你' }
  },
  {
    id: 'angel-status',
    title: '天使留言',
    subtitle: '4x2',
    cols: 4,
    rows: 2,
    className: 'angel-status-widget',
    data: {
      title: '爱上一个天使的缺点',
      handle: '@Wanwan_046',
      avatar: 'img/ava-00.jpg',
      topBgImage: '',
      message: '你對我來說是宇宙，但我對你來說只是一顆星嗎？'
    }
  },
  {
    id: 'profile',
    title: '个人资料',
    subtitle: '2x2',
    cols: 2,
    rows: 2,
    className: 'profile-widget',
    data: { name: '弯弯O.o', location: 'Seoul', avatar: 'img/ava-00.jpg', coverImage: '' }
  },
  {
    id: 'music',
    title: '音乐',
    subtitle: '2x2',
    cols: 2,
    rows: 2,
    className: 'music-widget',
    data: { cover: 'img/wanwan.png', title: 'Always Online', lyrics: '和你one to one愛開始擴散', currentTime: '1:28', totalTime: '5:20' }
  },
  {
    id: 'couple',
    title: '情侣卡片',
    subtitle: '2x2',
    cols: 2,
    rows: 2,
    className: 'couple-widget',
    data: { name1: '弯弯O.o', name2: '小狗神', count: '520', avatar1: 'img/ava-01.jpg', avatar2: 'img/ava-02.jpg', bubbleLeft: '你在左边', bubbleRight: '我靠近右' }
  },
  {
    id: 'bio-card',
    title: '个人名片',
    subtitle: '4x3',
    cols: 4,
    rows: 3,
    className: 'bio-card-widget',
    data: { name: '弯弯O.o', quote: '매일매일 조금이라도 행복하자. 💡', avatar: 'img/ava-00.jpg', coverImage: '' }
  },
  {
    id: 'calendar',
    title: '日历',
    subtitle: '4x2',
    cols: 4,
    rows: 2,
    className: 'calendar-widget',
    data: { username: '弯弯O.o', avatar: 'img/ava-00.jpg' }
  },
  {
    id: 'send-board',
    title: '留言面板',
    subtitle: '4x2',
    cols: 4,
    rows: 2,
    className: 'send-board-widget',
    data: { header: '보내기 ♡', name: '디저트', avatar: 'img/ava-00.jpg', line1: '고생 끝에 낙이 온다', line1Right: '슬프다', line2: 'kunoouc' }
  },
  {
    id: 'three-pics',
    title: '图片相册',
    subtitle: '4x2',
    cols: 4,
    rows: 2,
    className: 'three-pics-widget',
    data: {
      pic1: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG',
      pic2: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG',
      pic3: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/m2yV/1077X1076/BG_03.JPG',
      label: '3Pics',
      tag: '·ㅈ·'
    }
  },
  {
    id: 'file-type',
    title: '文件卡片',
    subtitle: '4x2',
    cols: 4,
    rows: 2,
    className: 'file-type-widget',
    data: {
      pic1: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG',
      pic2: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG',
      icon: '🍨',
      temp: '23°C',
      type1: 'Photo',
      caption1: '유치한 놈 ㅋㅋ',
      type2: 'Music',
      caption2: '🤍🖤ineedu...^'
    }
  },
  {
    id: 'mood-post',
    title: '心情贴文',
    subtitle: '4x2',
    cols: 4,
    rows: 2,
    className: 'mood-post-widget',
    data: {
      avatar: 'img/wanwan.png',
      title: 'Moonlight ✧˖°⋆✩',
      temp: '28°',
      pic1: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG',
      caption1: 'you have the sweetest soul I have ever seen.',
      pic2: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG',
      caption2: 'wish upon a star ⋆'
    }
  },
  {
    id: 'homepage',
    title: '在线状态',
    subtitle: '2x2',
    cols: 2,
    rows: 2,
    className: 'homepage-widget',
    data: { name: '弯弯O.o', handle: '@wanwan_046', avatar: 'img/ava-00.jpg', tags: '我 和 你', online: true }
  },
  {
    id: 'dynamic-caption',
    title: '个性签名',
    subtitle: '2x2',
    cols: 2,
    rows: 2,
    className: 'dynamic-caption-widget',
    data: { title: '☆ ·u and me.★', subtitle: '於你而言我是一個星嗎', bgImage: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/Qact/1077X1076/BG_05.JPG' }
  },
  {
    id: 'thread-post',
    title: '新建串文',
    subtitle: '4x3',
    cols: 4,
    rows: 3,
    className: 'thread-post-widget',
    data: {
      avatar: 'img/ava-00.jpg',
      name: 'Moonlight',
      time: '56m',
      text: '浅尝辄止 痛定思痛\nAm I not important in your heart...',
      pic: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG',
      likes: '99.0k'
    }
  },
  {
    id: 'photo-board',
    title: '照片日志',
    subtitle: '4x3',
    cols: 4,
    rows: 3,
    className: 'photo-board-widget',
    data: {
      title: 'WanwanWorld',
      weather: '晴 26°C',
      label1: '#No.1',
      caption1: '思绪回到那天，你说永远不会分开',
      pic1: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260725/KjoH/1176X1173/PHB1.JPG',
      label2: '#No.2',
      caption2: '等你读懂我的隐喻',
      pic2: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260725/zKzo/1176X1167/PHB2.JPG'
    }
  }
]

function getDesktopWidgetTemplate(templateId) {
  return DESKTOP_WIDGET_TEMPLATES.find(function(template) { return template.id === templateId })
}

function getDesktopItemSize(id) {
  var item = getDesktopIconRegistry()[id]
  if (item && item.type === 'widget') {
    var rows = item.templateId === 'bio-card' ? 3 : item.rows
    return {
      cols: Math.max(1, Math.min(DESKTOP_GRID_COLS, item.cols || 1)),
      rows: Math.max(1, rows || 1)
    }
  }
  return { cols: 1, rows: 1 }
}

function normalizeDesktopWidgetDefinition(widget) {
  if (!widget || widget.type !== 'widget') return widget
  if (widget.templateId === 'bio-card') {
    widget.cols = 4
    widget.rows = 3
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.avatar) widget.data.avatar = 'img/ava-00.jpg'
    if (!widget.data.coverImage) widget.data.coverImage = ''
    if (widget.data.name === '月亮O.o') widget.data.name = '弯弯O.o'
  }
  if (widget.templateId === 'angel-status') {
    widget.cols = 4
    widget.rows = 2
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.avatar) widget.data.avatar = 'img/ava-00.jpg'
  }
  if (widget.templateId === 'custom-html') {
    widget.data = Object.assign({}, widget.data || {})
    if (typeof widget.data.html !== 'string') widget.data.html = ''
    if (!widget.data.values || typeof widget.data.values !== 'object') widget.data.values = {}
  }
  if (widget.templateId === 'music') {
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.cover) widget.data.cover = 'img/wanwan.png'
    if (!widget.data.title) widget.data.title = 'Always Online'
    if (!widget.data.lyrics) widget.data.lyrics = widget.data.artist || '和你one to one愛開始擴散'
    if (!widget.data.currentTime) widget.data.currentTime = '1:28'
    if (!widget.data.totalTime) widget.data.totalTime = '5:20'
  }
  if (widget.templateId === 'calendar') {
    widget.cols = 4
    widget.rows = 2
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.avatar) widget.data.avatar = 'img/ava-00.jpg'
    if (!widget.data.username) widget.data.username = '弯弯O.o'
  }
  if (widget.templateId === 'homepage') {
    widget.cols = 2
    widget.rows = 2
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.avatar) widget.data.avatar = 'img/ava-00.jpg'
  }
  if (widget.templateId === 'send-board') {
    widget.cols = 4
    widget.rows = 2
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.avatar) widget.data.avatar = 'img/ava-00.jpg'
  }
  if (widget.templateId === 'three-pics') {
    widget.cols = 4
    widget.rows = 2
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.pic1) widget.data.pic1 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG'
    if (!widget.data.pic2) widget.data.pic2 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG'
    if (!widget.data.pic3) widget.data.pic3 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/m2yV/1077X1076/BG_03.JPG'
    if (!widget.data.label) widget.data.label = '3Pics'
    if (!widget.data.tag) widget.data.tag = '·ㅈ·'
  }
  if (widget.templateId === 'file-type') {
    widget.cols = 4
    widget.rows = 2
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.pic1) widget.data.pic1 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG'
    if (!widget.data.pic2) widget.data.pic2 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG'
    if (!widget.data.icon) widget.data.icon = '🍨'
    if (!widget.data.temp) widget.data.temp = '23°C'
    if (!widget.data.type1) widget.data.type1 = 'Photo'
    if (!widget.data.caption1) widget.data.caption1 = '유치한 놈 ㅋㅋ'
    if (!widget.data.type2) widget.data.type2 = 'Music'
    if (!widget.data.caption2) widget.data.caption2 = '🤍🖤ineedu...^'
  }
  if (widget.templateId === 'dynamic-caption') {
    widget.cols = 2
    widget.rows = 2
    widget.data = Object.assign({}, widget.data || {})
  }
  if (widget.templateId === 'mood-post') {
    widget.cols = 4
    widget.rows = 2
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.avatar) widget.data.avatar = 'img/wanwan.png'
    if (!widget.data.title) widget.data.title = 'Moonlight ✧˖°⋆✩'
    if (!widget.data.temp) widget.data.temp = '28°'
    if (!widget.data.pic1) widget.data.pic1 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG'
    if (!widget.data.pic2) widget.data.pic2 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG'
    if (widget.data.caption1 === undefined) widget.data.caption1 = 'you have the sweetest soul I have ever seen.'
    if (widget.data.caption2 === undefined) widget.data.caption2 = 'wish upon a star ⋆'
  }
  if (widget.templateId === 'thread-post') {
    widget.cols = 4
    widget.rows = 3
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.avatar) widget.data.avatar = 'img/ava-00.jpg'
    if (!widget.data.name) widget.data.name = 'Moonlight'
    if (!widget.data.time) widget.data.time = '56m'
    if (widget.data.text === undefined) widget.data.text = '浅尝辄止 痛定思痛\nAm I not important in your heart...'
    if (!widget.data.pic) widget.data.pic = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG'
    if (widget.data.likes === undefined) widget.data.likes = '99.0k'
  }
  if (widget.templateId === 'photo-board') {
    widget.cols = 4
    widget.rows = 3
    widget.data = Object.assign({}, widget.data || {})
    if (!widget.data.title) widget.data.title = 'WanwanWorld'
    if (!widget.data.weather) widget.data.weather = '晴 26°C'
    if (!widget.data.label1) widget.data.label1 = '#No.1'
    if (!widget.data.label2) widget.data.label2 = '#No.2'
    if (widget.data.caption1 === undefined) widget.data.caption1 = '思绪回到那天，你说永远不会分开'
    if (widget.data.caption2 === undefined) widget.data.caption2 = '等你读懂我的隐喻'
    if (!widget.data.pic1) widget.data.pic1 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260725/KjoH/1176X1173/PHB1.JPG'
    if (!widget.data.pic2) widget.data.pic2 = 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260725/zKzo/1176X1167/PHB2.JPG'
  }
  return widget
}

function parseMusicDuration(value) {
  var text = String(value || '').trim()
  var parts = text.split(':').map(function(part) { return parseInt(part, 10) })
  if (parts.some(function(part) { return !Number.isFinite(part) || part < 0 })) return 0
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 1) return parts[0]
  return 0
}

function getMusicProgressPercent(currentTime, totalTime) {
  var current = parseMusicDuration(currentTime)
  var total = parseMusicDuration(totalTime)
  if (!total) return 0
  return Math.max(0, Math.min(100, current / total * 100))
}

function canPlaceItemAt(slots, id, slotIndex, ignoreId) {
  var size = getDesktopItemSize(id)
  return canPlaceSizeAt(slots, size, slotIndex, ignoreId)
}

function canPlaceSizeAt(slots, size, slotIndex, ignoreId) {
  var col = slotIndex % DESKTOP_GRID_COLS
  var row = Math.floor(slotIndex / DESKTOP_GRID_COLS)
  if (col + size.cols > DESKTOP_GRID_COLS || row + size.rows > _desktopGridRows) return false
  for (var r = 0; r < size.rows; r++) {
    for (var c = 0; c < size.cols; c++) {
      var idx = (row + r) * DESKTOP_GRID_COLS + col + c
      var occupied = slots[idx]
      if (occupied && occupied !== ignoreId) return false
    }
  }
  return true
}

function markItemSlots(slots, id, slotIndex) {
  var size = getDesktopItemSize(id)
  markSizeSlots(slots, id, slotIndex, size)
}

function markSizeSlots(slots, id, slotIndex, size) {
  var col = slotIndex % DESKTOP_GRID_COLS
  var row = Math.floor(slotIndex / DESKTOP_GRID_COLS)
  for (var r = 0; r < size.rows; r++) {
    for (var c = 0; c < size.cols; c++) {
      slots[(row + r) * DESKTOP_GRID_COLS + col + c] = id
    }
  }
}

function clearItemSlots(slots, id) {
  for (var i = 0; i < slots.length; i++) {
    if (slots[i] === id) slots[i] = null
  }
}

function firstFittingSlot(page, id) {
  var slots = getPageSlots(page)
  for (var i = 0; i < _desktopSlotsPerPage; i++) {
    if (canPlaceItemAt(slots, id, i, id)) return i
  }
  return -1
}

function firstFittingSlotForSize(page, id, size) {
  var slots = getPageSlots(page)
  for (var i = 0; i < _desktopSlotsPerPage; i++) {
    if (canPlaceSizeAt(slots, size, i, id)) return i
  }
  return -1
}

function getDefaultDesktopLayout() {
  return {
    grid: { cols: DESKTOP_GRID_COLS },
    pages: DESKTOP_ICON_PAGES.map(function(page) {
      return { slots: page.map(function(item) { return item.id }) }
    }),
    dock: DOCK_ICONS.map(function(item) { return item.id })
  }
}

function createEmptyDesktopPage() {
  return { slots: new Array(_desktopSlotsPerPage).fill(null) }
}

function getPageSlots(page) {
  if (page && Array.isArray(page.slots)) return page.slots
  if (Array.isArray(page)) return page
  return []
}

function pageHasIcons(page) {
  return getPageSlots(page).some(function(id) { return !!id })
}

function firstEmptySlot(page) {
  var slots = getPageSlots(page)
  for (var i = 0; i < slots.length; i++) {
    if (!slots[i]) return i
  }
  return -1
}

function ensurePageAt(index) {
  var layout = ensureDesktopLayout()
  while (layout.pages.length <= index) layout.pages.push(createEmptyDesktopPage())
  return layout.pages[index]
}

function normalizeDesktopLayout(layout, keepTrailingEmpty) {
  var registry = getDesktopIconRegistry()
  var defaults = getDefaultDesktopLayout()
  var source = layout && Array.isArray(layout.pages) && Array.isArray(layout.dock) ? layout : defaults
  var seen = {}
  var next = { grid: { cols: DESKTOP_GRID_COLS }, pages: [], dock: [] }
  var queue = []

  function queueIcon(id) {
    if (!registry[id] || seen[id]) return
    seen[id] = true
    queue.push(id)
  }

  function placeQueuedIcons(preferredPage) {
    var pageIndex = preferredPage || 0
    while (queue.length) {
      if (!next.pages.length) next.pages.push(createEmptyDesktopPage())
      if (!next.pages[pageIndex]) next.pages[pageIndex] = createEmptyDesktopPage()
      var slotIndex = firstFittingSlot(next.pages[pageIndex], queue[0])
      if (slotIndex < 0) {
        pageIndex++
        continue
      }
      markItemSlots(next.pages[pageIndex].slots, queue.shift(), slotIndex)
    }
  }

  source.dock.forEach(function(id) {
    if (!registry[id] || seen[id] || next.dock.length >= DOCK_MAX_ICONS) return
    seen[id] = true
    next.dock.push(id)
  })

  source.pages.forEach(function(page, pageIndex) {
    var slots = getPageSlots(page)
    var nextPage = createEmptyDesktopPage()
    slots.forEach(function(id, slotIndex) {
      if (!registry[id] || seen[id]) return
      seen[id] = true
      if (slotIndex < _desktopSlotsPerPage && canPlaceItemAt(nextPage.slots, id, slotIndex)) markItemSlots(nextPage.slots, id, slotIndex)
      else queue.push(id)
    })
    next.pages[pageIndex] = nextPage
  })
  placeQueuedIcons(0)

  defaults.dock.concat(defaults.pages.reduce(function(list, page) {
    return list.concat(getPageSlots(page))
  }, [])).forEach(function(id) {
    queueIcon(id)
  })
  placeQueuedIcons(0)

  next.pages = next.pages.filter(function(page, index) {
    if (keepTrailingEmpty && index === next.pages.length - 1) return true
    return pageHasIcons(page)
  })
  if (!next.pages.length) next.pages.push(createEmptyDesktopPage())
  return next
}

async function loadDesktopLayout() {
  if (!window.db) {
    _desktopLayout = normalizeDesktopLayout(null, false)
    return _desktopLayout
  }
  var cfg = await db.config.get(DESKTOP_LAYOUT_KEY)
  var saved = cfg && cfg.value
  if (saved && saved.gridRows) {
    _desktopGridRows = saved.gridRows
    _desktopSlotsPerPage = DESKTOP_GRID_COLS * _desktopGridRows
  }
  _desktopLayout = normalizeDesktopLayout(saved, false)
  return _desktopLayout
}

async function loadDesktopWidgets() {
  if (!window.db) {
    _desktopWidgets = []
    return _desktopWidgets
  }
  var cfg = await db.config.get(DESKTOP_WIDGETS_KEY)
  _desktopWidgets = Array.isArray(cfg && cfg.value) ? cfg.value.filter(function(widget) {
    return widget && widget.id && widget.type === 'widget'
  }).map(function(widget) {
    return normalizeDesktopWidgetDefinition(widget)
  }) : []
  return _desktopWidgets
}

async function saveDesktopWidgets() {
  if (!window.db) return
  _desktopWidgets = _desktopWidgets.map(function(widget) {
    return normalizeDesktopWidgetDefinition(widget)
  })
  await db.config.put({ key: DESKTOP_WIDGETS_KEY, value: _desktopWidgets })
}

// ===== 自定义 HTML 组件模板（Widgets Gallery 中创建/管理） =====
var CUSTOM_WIDGET_TEMPLATES_KEY = 'customWidgetTemplates'
var _customWidgetTemplates = []

async function loadCustomWidgetTemplates() {
  if (!window.db) {
    _customWidgetTemplates = []
    return _customWidgetTemplates
  }
  var cfg = await db.config.get(CUSTOM_WIDGET_TEMPLATES_KEY)
  _customWidgetTemplates = Array.isArray(cfg && cfg.value) ? cfg.value.filter(function(tpl) {
    return tpl && tpl.id && typeof tpl.html === 'string' && tpl.html
  }) : []
  return _customWidgetTemplates
}

async function saveCustomWidgetTemplates() {
  if (!window.db) return
  await db.config.put({ key: CUSTOM_WIDGET_TEMPLATES_KEY, value: _customWidgetTemplates })
}

async function saveDesktopLayout() {
  if (!window.db || !_desktopLayout) return
  var toSave = normalizeDesktopLayout(_desktopLayout, false)
  toSave.gridRows = _desktopGridRows
  await db.config.put({ key: DESKTOP_LAYOUT_KEY, value: toSave })
}

function ensureDesktopLayout() {
  if (!_desktopLayout) _desktopLayout = normalizeDesktopLayout(null, false)
  return _desktopLayout
}

function getDesktopItem(id) {
  return getDesktopIconRegistry()[id]
}

function ensureEditableTrailingPage() {
  var layout = ensureDesktopLayout()
  if (!layout.pages.length || pageHasIcons(layout.pages[layout.pages.length - 1])) layout.pages.push(createEmptyDesktopPage())
  TOTAL_PAGES = layout.pages.length
}

function cleanDesktopPages() {
  _desktopLayout = normalizeDesktopLayout(_desktopLayout, false)
  TOTAL_PAGES = _desktopLayout.pages.length
  currentPage = Math.max(0, Math.min(currentPage, TOTAL_PAGES - 1))
}

function removeIconFromLayout(id) {
  var layout = ensureDesktopLayout()
  var removed = null
  layout.dock = layout.dock.filter(function(itemId, index) {
    if (itemId === id) {
      removed = { area: 'dock', page: -1, index: index }
      return false
    }
    return true
  })
  layout.pages.forEach(function(page, pageIndex) {
    var slots = getPageSlots(page)
    var itemIndex = slots.indexOf(id)
    if (itemIndex >= 0) {
      clearItemSlots(slots, id)
      removed = { area: 'desktop', page: pageIndex, index: itemIndex }
    }
  })
  return removed
}

async function removeDesktopWidget(id) {
  var item = getDesktopItem(id)
  if (!item || item.type !== 'widget') return
  removeIconFromLayout(id)
  _desktopWidgets = _desktopWidgets.filter(function(widget) {
    return widget.id !== id
  })
  await saveDesktopWidgets()
  await saveDesktopLayout()
  window.refreshDesktop()
  window.toast('组件已删除')
}

function placeIconAtDesktopSlot(id, pageIndex, slotIndex) {
  var layout = ensureDesktopLayout()
  pageIndex = Math.max(0, Math.min(pageIndex == null ? currentPage : pageIndex, layout.pages.length - 1))
  var page = ensurePageAt(pageIndex)
  slotIndex = slotIndex == null || slotIndex < 0 ? firstFittingSlot(page, id) : Math.min(slotIndex, _desktopSlotsPerPage - 1)
  if (!canPlaceItemAt(page.slots, id, slotIndex, id)) slotIndex = firstFittingSlot(page, id)
  if (slotIndex < 0) {
    page = ensurePageAt(pageIndex + 1)
    slotIndex = firstFittingSlot(page, id)
  }
  if (slotIndex >= 0) markItemSlots(page.slots, id, slotIndex)
}

function placeIconInFirstEmptySlot(id, preferredPage) {
  var layout = ensureDesktopLayout()
  var startPage = Math.max(0, preferredPage == null ? currentPage : preferredPage)
  for (var i = startPage; i < layout.pages.length; i++) {
    var slotIndex = firstFittingSlot(layout.pages[i], id)
    if (slotIndex >= 0) {
      markItemSlots(layout.pages[i].slots, id, slotIndex)
      return { page: i, index: slotIndex }
    }
  }
  var page = ensurePageAt(layout.pages.length)
  var slotIndex = firstFittingSlot(page, id)
  if (slotIndex < 0) slotIndex = 0
  markItemSlots(page.slots, id, slotIndex)
  return { page: layout.pages.length - 1, index: 0 }
}

function placeWidgetInFirstEmptySlot(widget, preferredPage) {
  widget = normalizeDesktopWidgetDefinition(widget)
  var size = {
    cols: Math.max(1, Math.min(DESKTOP_GRID_COLS, widget.cols || 1)),
    rows: Math.max(1, widget.rows || 1)
  }
  var layout = ensureDesktopLayout()
  var startPage = Math.max(0, preferredPage == null ? currentPage : preferredPage)
  for (var i = startPage; i < layout.pages.length; i++) {
    var slotIndex = firstFittingSlotForSize(layout.pages[i], widget.id, size)
    if (slotIndex >= 0) {
      markSizeSlots(layout.pages[i].slots, widget.id, slotIndex, size)
      return { page: i, index: slotIndex }
    }
  }
  var page = ensurePageAt(layout.pages.length)
  var newSlotIndex = firstFittingSlotForSize(page, widget.id, size)
  if (newSlotIndex < 0) newSlotIndex = 0
  markSizeSlots(page.slots, widget.id, newSlotIndex, size)
  return { page: layout.pages.length - 1, index: newSlotIndex }
}

function moveIconToDock(id, source) {
  var item = getDesktopItem(id)
  if (item && item.type === 'widget') return
  var layout = ensureDesktopLayout()
  removeIconFromLayout(id)
  layout.dock.push(id)
  while (layout.dock.length > DOCK_MAX_ICONS) {
    var overflowIndex = layout.dock.length - 1
    if (layout.dock[overflowIndex] === id && overflowIndex > 0) overflowIndex--
    var overflowId = layout.dock.splice(overflowIndex, 1)[0]
    var targetPage = source && source.area === 'desktop' ? source.page : currentPage
    placeIconInFirstEmptySlot(overflowId, targetPage)
  }
}

function moveIconToDesktop(id, pageIndex, slotIndex) {
  var layout = ensureDesktopLayout()
  var page = ensurePageAt(pageIndex)
  slotIndex = Math.max(0, Math.min(slotIndex == null ? 0 : slotIndex, _desktopSlotsPerPage - 1))
  var targetId = page.slots[slotIndex]
  var source = removeIconFromLayout(id)
  page = ensurePageAt(pageIndex)
  if (targetId && targetId !== id) removeIconFromLayout(targetId)
  if (!canPlaceItemAt(page.slots, id, slotIndex, id)) slotIndex = firstFittingSlot(page, id)
  if (slotIndex < 0) {
    placeIconInFirstEmptySlot(id, pageIndex)
  } else {
    markItemSlots(page.slots, id, slotIndex)
  }
  if (targetId && targetId !== id) {
    if (source && source.area === 'desktop') placeIconAtDesktopSlot(targetId, source.page, source.index)
    else if (source && source.area === 'dock') layout.dock.splice(Math.min(source.index, layout.dock.length), 0, targetId)
    else placeIconInFirstEmptySlot(targetId, pageIndex)
  }
}

function getAllDesktopIcons() {
  var registry = getDesktopIconRegistry()
  return getDefaultDesktopLayout().dock.concat(getDefaultDesktopLayout().pages.reduce(function(list, page) {
    return list.concat(getPageSlots(page))
  }, [])).map(function(id) {
    return registry[id]
  }).filter(Boolean)
}

function getDesktopIconCustom(id) {
  return _desktopIconCustomizations && _desktopIconCustomizations[id]
    ? _desktopIconCustomizations[id]
    : {}
}

async function loadDesktopIconCustomizations() {
  if (!window.db) return {}
  var cfg = await db.config.get(DESKTOP_ICON_CUSTOM_KEY)
  _desktopIconCustomizations = cfg && cfg.value && typeof cfg.value === 'object' ? cfg.value : {}
  return _desktopIconCustomizations
}

async function saveDesktopIconCustomizations() {
  await db.config.put({ key: DESKTOP_ICON_CUSTOM_KEY, value: _desktopIconCustomizations })
}

function normalizeDesktopLabelColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : ''
}

async function loadDesktopLabelColor() {
  if (!window.db) return ''
  var cfg = await db.config.get(DESKTOP_LABEL_COLOR_KEY)
  _desktopLabelColor = normalizeDesktopLabelColor(cfg && cfg.value)
  return _desktopLabelColor
}

async function saveDesktopLabelColor() {
  if (_desktopLabelColor) {
    await db.config.put({ key: DESKTOP_LABEL_COLOR_KEY, value: _desktopLabelColor })
  } else {
    await db.config.delete(DESKTOP_LABEL_COLOR_KEY)
  }
}

function applyDesktopLabelColor(home) {
  home = home || document.getElementById('home-page')
  if (!home) return
  home.classList.toggle('has-custom-desktop-label-color', !!_desktopLabelColor)
  if (_desktopLabelColor) home.style.setProperty('--desktop-label-color', _desktopLabelColor)
  else home.style.removeProperty('--desktop-label-color')
}

function rgbColorToHex(color) {
  var match = String(color || '').match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i)
  if (!match) return ''
  return '#' + [match[1], match[2], match[3]].map(function(value) {
    return Math.max(0, Math.min(255, parseInt(value, 10))).toString(16).padStart(2, '0')
  }).join('')
}

function getDesktopLabelPickerColor() {
  if (_desktopLabelColor) return _desktopLabelColor
  var label = document.querySelector('#home-page .icon-label, #home-page .dock-item span')
  return label ? (rgbColorToHex(getComputedStyle(label).color) || '#787878') : '#787878'
}

function buildDesktopIconInner(item, custom) {
  if (custom && custom.image) {
    return '<img src="' + escapeMainHtml(custom.image) + '" alt="">'
  }
  return item.img ? '<img src="' + escapeMainHtml(item.img) + '" alt="">' :
    (item.fa ? '<i class="' + escapeMainHtml(item.fa) + '"></i>' : item.svg)
}

function buildDesktopIconStyle(custom) {
  var color = custom && custom.color ? custom.color : ''
  return color ? ' style="--icon-color:' + escapeMainHtml(color) + '"' : ''
}

function buildDesktopIconButton(item, area) {
  var custom = getDesktopIconCustom(item.id)
  var bgClass = area === 'dock' ? 'dock-icon-bg' : 'icon-bg'
  var label = area === 'dock'
    ? '<span>' + escapeMainHtml(item.label) + '</span>'
    : '<span class="icon-label">' + escapeMainHtml(item.label) + '</span>'
  return '<div class="' + bgClass + '"' + buildDesktopIconStyle(custom) + '>' +
    buildDesktopIconInner(item, custom) +
    '</div>' + label
}

function formatAngelStatusDate(date) {
  var d = date || new Date()
  var weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  var month = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  return month + '.' + day + '·' + weekdays[d.getDay()]
}

function formatPhotoBoardWeekday(date) {
  var d = date || new Date()
  var weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return '#' + weekdays[d.getDay()]
}

function formatPhotoBoardDate(date) {
  var d = date || new Date()
  var month = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '年' + month + '月' + day + '日'
}

function openTopWidgetEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'top') return
  var data = Object.assign({
    title: '@WanWan.zzz',
    subtext: '某年某月某个星期几',
    avatar: 'img/ava-00.jpg'
  }, widget.data || {})
  if (data.title === '@XinYue.zzz') data.title = '@WanWan.zzz'
  if (data.subtext === '某年某月某个星期几°˙♡') data.subtext = '某年某月某个星期几'
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal top-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar top-editor-avatar" id="top-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>标题<input class="input-field" id="top-editor-title" value="' + escapeMainHtml(data.title) + '"></label>' +
      '<label>文案<input class="input-field" id="top-editor-subtext" value="' + escapeMainHtml(data.subtext) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="top-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="top-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#top-editor-cancel').addEventListener('click', close)
  modal.querySelector('#top-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#top-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#top-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      title: modal.querySelector('#top-editor-title').value.trim() || '@WanWan.zzz',
      subtext: modal.querySelector('#top-editor-subtext').value.trim() || '某年某月某个星期几',
      avatar: data.avatar || 'img/ava-00.jpg'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openTextMoodWidgetEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'text-mood') return
  var data = Object.assign({
    title: '💭·🍶날씨가 추워.',
    subtext: '萌萌之中早已注定'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal text-mood-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-form">' +
      '<label>心情<input class="input-field" id="text-mood-editor-title" value="' + escapeMainHtml(data.title) + '"></label>' +
      '<label>文案<input class="input-field" id="text-mood-editor-subtext" value="' + escapeMainHtml(data.subtext) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="text-mood-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="text-mood-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#text-mood-editor-cancel').addEventListener('click', close)
  modal.querySelector('#text-mood-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      title: modal.querySelector('#text-mood-editor-title').value.trim() || '💭·🍶날씨가 추워.',
      subtext: modal.querySelector('#text-mood-editor-subtext').value.trim() || '萌萌之中早已注定'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openCustomHtmlWidgetEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'custom-html') return
  var data = widget.data || {}
  var values = Object.assign({}, data.values || {})
  var slots = parseCustomHtmlSlots(data.html)
  if (!slots.length) {
    window.toast('该组件没有可编辑的 {avatar:} / {text:} 占位符')
    return
  }
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal custom-html-editor-modal'
  modal.style.zIndex = '241'
  var fieldsHtml = slots.map(function(slot, index) {
    if (slot.kind === 'avatar') {
      var avatarSrc = values[slot.name] || 'img/ava-00.jpg'
      return '<div class="custom-html-editor-avatar-row">' +
        '<span class="custom-html-editor-label">' + escapeMainHtml(slot.name) + '</span>' +
        '<button class="angel-editor-avatar custom-html-editor-avatar" data-slot-index="' + index + '" type="button" aria-label="选择图片">' +
          '<img src="' + escapeMainHtml(avatarSrc) + '" alt="">' +
        '</button>' +
      '</div>'
    }
    return '<label>' + escapeMainHtml(slot.name) +
      '<input class="input-field custom-html-editor-text" data-slot-index="' + index + '" value="' + escapeMainHtml(values[slot.name] || '') + '" placeholder="' + escapeMainHtml(slot.name) + '">' +
    '</label>'
  }).join('')
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-form custom-html-editor-form">' +
      fieldsHtml +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="custom-html-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="custom-html-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#custom-html-editor-cancel').addEventListener('click', close)
  modal.querySelectorAll('.custom-html-editor-avatar').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var slot = slots[parseInt(btn.dataset.slotIndex, 10)]
      window.showImagePicker(function(imageUrl) {
        values[slot.name] = imageUrl
        var img = btn.querySelector('img')
        if (img) img.src = imageUrl
      })
    })
  })
  modal.querySelector('#custom-html-editor-save').addEventListener('click', async function() {
    modal.querySelectorAll('.custom-html-editor-text').forEach(function(input) {
      var slot = slots[parseInt(input.dataset.slotIndex, 10)]
      var value = input.value.trim()
      if (value) values[slot.name] = value
      else delete values[slot.name]
    })
    widget.data = Object.assign({}, widget.data || {}, { values: values })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openAngelStatusEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'angel-status') return
  var data = Object.assign({
    title: '爱上一个天使的缺点',
    handle: '@Wanwan_046',
    avatar: 'img/ava-00.jpg',
    topBgImage: '',
    message: '你對我來說是宇宙，但我對你來說只是一顆星嗎？'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar" id="angel-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>标题<input class="input-field" id="angel-editor-title" value="' + escapeMainHtml(data.title) + '"></label>' +
      '<label>账号<input class="input-field" id="angel-editor-handle" value="' + escapeMainHtml(data.handle) + '"></label>' +
      '<label>背景图片<button class="angel-editor-bg-picker" id="angel-editor-bg-picker" type="button">' +
        '<span class="angel-editor-bg-preview" id="angel-editor-bg-preview"' + (data.topBgImage ? ' style="background-image:url(' + escapeMainHtml(data.topBgImage) + ')"' : '') + '></span>' +
        '<span>' + (data.topBgImage ? '更换背景' : '选择背景') + '</span>' +
      '</button></label>' +
      '<label>文案<textarea class="input-field" id="angel-editor-message">' + escapeMainHtml(data.message) + '</textarea></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="angel-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="angel-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#angel-editor-cancel').addEventListener('click', close)
  modal.querySelector('#angel-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#angel-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#angel-editor-bg-picker').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.topBgImage = imageUrl
      var preview = modal.querySelector('#angel-editor-bg-preview')
      if (preview) preview.style.backgroundImage = 'url(' + imageUrl + ')'
      var label = modal.querySelector('#angel-editor-bg-picker span:last-child')
      if (label) label.textContent = '更换背景'
    })
  })
  modal.querySelector('#angel-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      title: modal.querySelector('#angel-editor-title').value.trim() || '爱上一个天使的缺点',
      handle: modal.querySelector('#angel-editor-handle').value.trim() || '@Wanwan_046',
      avatar: data.avatar || 'img/ava-00.jpg',
      topBgImage: data.topBgImage || '',
      message: modal.querySelector('#angel-editor-message').value.trim() || '你對我來說是宇宙，但我對你來說只是一顆星嗎？'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openChatBubbleEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'chat-bubble') return
  var data = Object.assign({
    right: '我讨厌你',
    left: '我知道，我也爱你',
    rightAvatar: 'img/ava-01.jpg',
    leftAvatar: 'img/ava-02.jpg'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal chat-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="chat-editor-avatars">' +
      '<button class="angel-editor-avatar chat-editor-avatar" id="chat-editor-right-avatar" type="button" aria-label="选择右侧头像">' +
        '<img src="' + escapeMainHtml(data.rightAvatar) + '" alt="">' +
        '<span>右侧头像</span>' +
      '</button>' +
      '<button class="angel-editor-avatar chat-editor-avatar" id="chat-editor-left-avatar" type="button" aria-label="选择左侧头像">' +
        '<img src="' + escapeMainHtml(data.leftAvatar) + '" alt="">' +
        '<span>左侧头像</span>' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>右侧文字<input class="input-field" id="chat-editor-right" value="' + escapeMainHtml(data.right) + '"></label>' +
      '<label>左侧文字<input class="input-field" id="chat-editor-left" value="' + escapeMainHtml(data.left) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="chat-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="chat-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#chat-editor-cancel').addEventListener('click', close)
  modal.querySelector('#chat-editor-right-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.rightAvatar = imageUrl
      var img = modal.querySelector('#chat-editor-right-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#chat-editor-left-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.leftAvatar = imageUrl
      var img = modal.querySelector('#chat-editor-left-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#chat-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      right: modal.querySelector('#chat-editor-right').value.trim() || '我讨厌你',
      left: modal.querySelector('#chat-editor-left').value.trim() || '我知道，我也爱你',
      rightAvatar: data.rightAvatar || 'img/ava-01.jpg',
      leftAvatar: data.leftAvatar || 'img/ava-02.jpg'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openProfileWidgetEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'profile') return
  var data = Object.assign({
    name: '弯弯O.o',
    location: 'Seoul',
    avatar: 'img/ava-00.jpg',
    coverImage: ''
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal profile-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar" id="profile-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>背景图片<button class="angel-editor-bg-picker" id="profile-editor-cover-picker" type="button">' +
        '<span class="angel-editor-bg-preview profile-editor-cover-preview" id="profile-editor-cover-preview"' + (data.coverImage ? ' style="background-image:url(' + escapeMainHtml(data.coverImage) + ')"' : '') + '></span>' +
        '<span>' + (data.coverImage ? '更换背景' : '选择背景') + '</span>' +
      '</button></label>' +
      '<label>昵称<input class="input-field" id="profile-editor-name" value="' + escapeMainHtml(data.name) + '"></label>' +
      '<label>位置<input class="input-field" id="profile-editor-location" value="' + escapeMainHtml(data.location) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="profile-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="profile-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#profile-editor-cancel').addEventListener('click', close)
  modal.querySelector('#profile-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#profile-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#profile-editor-cover-picker').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.coverImage = imageUrl
      var preview = modal.querySelector('#profile-editor-cover-preview')
      if (preview) preview.style.backgroundImage = 'url(' + imageUrl + ')'
      var label = modal.querySelector('#profile-editor-cover-picker span:last-child')
      if (label) label.textContent = '更换背景'
    })
  })
  modal.querySelector('#profile-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      name: modal.querySelector('#profile-editor-name').value.trim() || '弯弯O.o',
      location: modal.querySelector('#profile-editor-location').value.trim() || 'Seoul',
      avatar: data.avatar || 'img/ava-00.jpg',
      coverImage: data.coverImage || ''
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openMusicWidgetEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'music') return
  var data = Object.assign({
    cover: 'img/wanwan.png',
    title: 'Always Online',
    lyrics: '和你one to one愛開始擴散',
    currentTime: '1:28',
    totalTime: '5:20'
  }, widget.data || {})
  if (!data.lyrics) data.lyrics = data.artist || '和你one to one愛開始擴散'
  var overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal music-editor-modal'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar music-editor-cover" id="music-editor-cover" type="button" aria-label="选择封面">' +
        '<img src="' + escapeMainHtml(data.cover) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>歌曲名称<input class="input-field" id="music-editor-title" value="' + escapeMainHtml(data.title) + '"></label>' +
      '<label>歌词<input class="input-field" id="music-editor-lyrics" value="' + escapeMainHtml(data.lyrics) + '"></label>' +
      '<label>当前时长<input class="input-field" id="music-editor-current" value="' + escapeMainHtml(data.currentTime) + '" placeholder="1:28"></label>' +
      '<label>总时长<input class="input-field" id="music-editor-total" value="' + escapeMainHtml(data.totalTime) + '" placeholder="5:20"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="music-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="music-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#music-editor-cancel').addEventListener('click', close)
  modal.querySelector('#music-editor-cover').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.cover = imageUrl
      var img = modal.querySelector('#music-editor-cover img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#music-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      cover: data.cover || 'img/wanwan.png',
      title: modal.querySelector('#music-editor-title').value.trim() || 'Always Online',
      lyrics: modal.querySelector('#music-editor-lyrics').value.trim() || '和你one to one愛開始擴散',
      currentTime: modal.querySelector('#music-editor-current').value.trim() || '1:28',
      totalTime: modal.querySelector('#music-editor-total').value.trim() || '5:20'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

// 从纪念日到今天一共多少天，纪念日当天算第 1 天；日期无效返回 null，纪念日在未来显示 0
function coupleDaysSince(dateStr) {
  var m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  var start = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  var now = new Date()
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((today - start) / 86400000) + 1)
}

function openCoupleWidgetEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'couple') return
  var data = Object.assign({
    avatar1: 'img/ava-01.jpg',
    avatar2: 'img/ava-02.jpg',
    name1: '弯弯O.o',
    name2: '小狗神',
    bubbleLeft: '你在左边',
    bubbleRight: '我靠近右',
    count: '520',
    countMode: 'manual',
    anniversary: ''
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal couple-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="chat-editor-avatars">' +
      '<button class="angel-editor-avatar chat-editor-avatar" id="couple-editor-left-avatar" type="button" aria-label="选择左侧头像">' +
        '<img src="' + escapeMainHtml(data.avatar1) + '" alt="">' +
        '<span>头像「左」</span>' +
      '</button>' +
      '<button class="angel-editor-avatar chat-editor-avatar" id="couple-editor-right-avatar" type="button" aria-label="选择右侧头像">' +
        '<img src="' + escapeMainHtml(data.avatar2) + '" alt="">' +
        '<span>头像「右」</span>' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>昵称「左」<input class="input-field" id="couple-editor-name1" value="' + escapeMainHtml(data.name1) + '"></label>' +
      '<label>昵称「右」<input class="input-field" id="couple-editor-name2" value="' + escapeMainHtml(data.name2) + '"></label>' +
      '<label>气泡「左」<input class="input-field" id="couple-editor-bubble-left" value="' + escapeMainHtml(data.bubbleLeft) + '"></label>' +
      '<label>气泡「右」<input class="input-field" id="couple-editor-bubble-right" value="' + escapeMainHtml(data.bubbleRight) + '"></label>' +
      '<label>计数方式<select class="input-field" id="couple-editor-mode">' +
        '<option value="manual">手动填写</option>' +
        '<option value="anniversary">纪念日（自动算天数）</option>' +
      '</select></label>' +
      '<label id="couple-editor-count-wrap">计数<input class="input-field" id="couple-editor-count" value="' + escapeMainHtml(data.count || '520') + '" placeholder="520"></label>' +
      '<label id="couple-editor-date-wrap">纪念日<input class="input-field" id="couple-editor-date" type="date" value="' + escapeMainHtml(data.anniversary || '') + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="couple-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="couple-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#couple-editor-cancel').addEventListener('click', close)
  var coupleModeSelect = modal.querySelector('#couple-editor-mode')
  var syncCoupleMode = function() {
    var isAnniversary = coupleModeSelect.value === 'anniversary'
    modal.querySelector('#couple-editor-count-wrap').style.display = isAnniversary ? 'none' : ''
    modal.querySelector('#couple-editor-date-wrap').style.display = isAnniversary ? '' : 'none'
  }
  coupleModeSelect.value = data.countMode === 'anniversary' ? 'anniversary' : 'manual'
  coupleModeSelect.addEventListener('change', syncCoupleMode)
  syncCoupleMode()
  modal.querySelector('#couple-editor-left-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar1 = imageUrl
      var img = modal.querySelector('#couple-editor-left-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#couple-editor-right-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar2 = imageUrl
      var img = modal.querySelector('#couple-editor-right-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#couple-editor-save').addEventListener('click', async function() {
    var coupleMode = coupleModeSelect.value === 'anniversary' ? 'anniversary' : 'manual'
    var coupleDate = modal.querySelector('#couple-editor-date').value
    if (coupleMode === 'anniversary' && !coupleDate) {
      if (window.toast) window.toast('请先选择纪念日')
      return
    }
    widget.data = Object.assign({}, widget.data || {}, {
      avatar1: data.avatar1 || 'img/ava-01.jpg',
      avatar2: data.avatar2 || 'img/ava-02.jpg',
      name1: modal.querySelector('#couple-editor-name1').value.trim() || '弯弯O.o',
      name2: modal.querySelector('#couple-editor-name2').value.trim() || '小狗神',
      bubbleLeft: modal.querySelector('#couple-editor-bubble-left').value.trim() || '你在左边',
      bubbleRight: modal.querySelector('#couple-editor-bubble-right').value.trim() || '我靠近右',
      count: modal.querySelector('#couple-editor-count').value.trim() || '520',
      countMode: coupleMode,
      anniversary: coupleDate || ''
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openBioCardEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'bio-card') return
  var data = Object.assign({
    name: '弯弯O.o',
    quote: '매일매일 조금이라도 행복하자. 💡',
    avatar: 'img/ava-00.jpg',
    coverImage: ''
  }, widget.data || {})
  if (data.name === '月亮O.o') data.name = '弯弯O.o'
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal bio-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar top-editor-avatar" id="bio-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>背景图片<button class="angel-editor-bg-picker" id="bio-editor-cover-picker" type="button">' +
        '<span class="angel-editor-bg-preview bio-editor-cover-preview" id="bio-editor-cover-preview"' + (data.coverImage ? ' style="background-image:url(' + escapeMainHtml(data.coverImage) + ')"' : '') + '></span>' +
        '<span>' + (data.coverImage ? '更换背景' : '选择背景') + '</span>' +
      '</button></label>' +
      '<label>昵称<input class="input-field" id="bio-editor-name" value="' + escapeMainHtml(data.name) + '"></label>' +
      '<label>文案<textarea class="input-field" id="bio-editor-quote">' + escapeMainHtml(data.quote) + '</textarea></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="bio-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="bio-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#bio-editor-cancel').addEventListener('click', close)
  modal.querySelector('#bio-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#bio-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#bio-editor-cover-picker').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.coverImage = imageUrl
      var preview = modal.querySelector('#bio-editor-cover-preview')
      if (preview) preview.style.backgroundImage = 'url(' + imageUrl + ')'
      var label = modal.querySelector('#bio-editor-cover-picker span:last-child')
      if (label) label.textContent = '更换背景'
    })
  })
  modal.querySelector('#bio-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      name: modal.querySelector('#bio-editor-name').value.trim() || '弯弯O.o',
      quote: modal.querySelector('#bio-editor-quote').value.trim() || '매일매일 조금이라도 행복하자. 💡',
      avatar: data.avatar || 'img/ava-00.jpg',
      coverImage: data.coverImage || ''
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openCalendarWidgetEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'calendar') return
  var data = Object.assign({
    username: '弯弯O.o',
    avatar: 'img/ava-00.jpg'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar top-editor-avatar" id="cal-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>用户名<input class="input-field" id="cal-editor-username" value="' + escapeMainHtml(data.username) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="cal-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="cal-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#cal-editor-cancel').addEventListener('click', close)
  modal.querySelector('#cal-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#cal-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#cal-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      username: modal.querySelector('#cal-editor-username').value.trim() || '弯弯O.o',
      avatar: data.avatar || 'img/ava-00.jpg'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openHomepageWidgetEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'homepage') return
  var data = Object.assign({
    name: '弯弯O.o',
    handle: '@wanwan_046',
    avatar: 'img/ava-00.jpg',
    tags: '我 和 你',
    online: true
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal homepage-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar top-editor-avatar" id="hp-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>昵称<input class="input-field" id="hp-editor-name" value="' + escapeMainHtml(data.name) + '"></label>' +
      '<label>ID<input class="input-field" id="hp-editor-handle" value="' + escapeMainHtml(data.handle) + '"></label>' +
      '<label>标签<input class="input-field" id="hp-editor-tags" value="' + escapeMainHtml(data.tags) + '" placeholder="空格分隔"></label>' +
      '<label class="angel-editor-checkbox"><input type="checkbox" id="hp-editor-online"' + (data.online ? ' checked' : '') + '><span>显示在线状态</span></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="hp-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="hp-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#hp-editor-cancel').addEventListener('click', close)
  modal.querySelector('#hp-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#hp-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#hp-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      name: modal.querySelector('#hp-editor-name').value.trim() || '弯弯O.o',
      handle: modal.querySelector('#hp-editor-handle').value.trim() || '@wanwan_046',
      avatar: data.avatar || 'img/ava-00.jpg',
      tags: modal.querySelector('#hp-editor-tags').value.trim() || '我 和 你',
      online: modal.querySelector('#hp-editor-online').checked
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openSendBoardEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'send-board') return
  var data = Object.assign({
    header: '보내기 ♡',
    name: '디저트',
    avatar: 'img/ava-00.jpg',
    line1: '고생 끝에 낙이 온다',
    line1Right: '슬프다',
    line2: 'kunoouc'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar top-editor-avatar" id="sb-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>标题<input class="input-field" id="sb-editor-header" value="' + escapeMainHtml(data.header) + '"></label>' +
      '<label>昵称<input class="input-field" id="sb-editor-name" value="' + escapeMainHtml(data.name) + '"></label>' +
      '<label>文字行<input class="input-field" id="sb-editor-line1" value="' + escapeMainHtml(data.line1) + '"></label>' +
      '<label>文字注解<input class="input-field" id="sb-editor-line1-right" value="' + escapeMainHtml(data.line1Right) + '"></label>' +
      '<label>发送行<input class="input-field" id="sb-editor-line2" value="' + escapeMainHtml(data.line2) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="sb-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="sb-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#sb-editor-cancel').addEventListener('click', close)
  modal.querySelector('#sb-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#sb-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#sb-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      header: modal.querySelector('#sb-editor-header').value.trim() || '보내기 ♡',
      name: modal.querySelector('#sb-editor-name').value.trim() || '디저트',
      avatar: data.avatar || 'img/ava-00.jpg',
      line1: modal.querySelector('#sb-editor-line1').value.trim() || '고생 끝에 낙이 온다',
      line1Right: modal.querySelector('#sb-editor-line1-right').value.trim() || '슬프다',
      line2: modal.querySelector('#sb-editor-line2').value.trim() || 'kunoouc'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openThreePicsEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'three-pics') return
  var data = Object.assign({
    pic1: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG',
    pic2: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG',
    pic3: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/m2yV/1077X1076/BG_03.JPG',
    label: '3Pics',
    tag: '·ㅈ·'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal'
  modal.style.zIndex = '241'
  var pickerHtml = [1, 2, 3].map(function(n) {
    var url = data['pic' + n]
    return '<button class="tp-editor-photo" id="tp-editor-pic-' + n + '" type="button" aria-label="选择图片' + n + '">' +
      '<img src="' + escapeMainHtml(url) + '" alt="">' +
    '</button>'
  }).join('')
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="tp-editor-photos">' + pickerHtml + '</div>' +
    '<div class="angel-editor-form">' +
      '<label>左侧标签<input class="input-field" id="tp-editor-label" value="' + escapeMainHtml(data.label) + '"></label>' +
      '<label>右侧标签<input class="input-field" id="tp-editor-tag" value="' + escapeMainHtml(data.tag) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="tp-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="tp-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#tp-editor-cancel').addEventListener('click', close)
  ;[1, 2, 3].forEach(function(n) {
    modal.querySelector('#tp-editor-pic-' + n).addEventListener('click', function() {
      window.showImagePicker(function(imageUrl) {
        data['pic' + n] = imageUrl
        var img = modal.querySelector('#tp-editor-pic-' + n + ' img')
        if (img) img.src = imageUrl
      })
    })
  })
  modal.querySelector('#tp-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      pic1: data.pic1,
      pic2: data.pic2,
      pic3: data.pic3,
      label: modal.querySelector('#tp-editor-label').value.trim() || '3Pics',
      tag: modal.querySelector('#tp-editor-tag').value.trim() || '·ㅈ·'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openFileTypeEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'file-type') return
  var data = Object.assign({
    pic1: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG',
    pic2: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG',
    icon: '🍨',
    temp: '23°C',
    type1: 'Photo',
    caption1: '유치한 놈 ㅋㅋ',
    type2: 'Music',
    caption2: '🤍🖤ineedu...^'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal'
  modal.style.zIndex = '241'
  var pickerHtml = [1, 2].map(function(n) {
    var url = data['pic' + n]
    return '<button class="tp-editor-photo" id="ft-editor-pic-' + n + '" type="button" aria-label="选择图片' + n + '">' +
      '<img src="' + escapeMainHtml(url) + '" alt="">' +
    '</button>'
  }).join('')
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="tp-editor-photos">' + pickerHtml + '</div>' +
    '<div class="angel-editor-form">' +
      '<label>图标<input class="input-field" id="ft-editor-icon" value="' + escapeMainHtml(data.icon) + '"></label>' +
      '<label>温度<input class="input-field" id="ft-editor-temp" value="' + escapeMainHtml(data.temp) + '"></label>' +
      '<label>类型 1<input class="input-field" id="ft-editor-type1" value="' + escapeMainHtml(data.type1) + '"></label>' +
      '<label>文案 1<input class="input-field" id="ft-editor-caption1" value="' + escapeMainHtml(data.caption1) + '"></label>' +
      '<label>类型 2<input class="input-field" id="ft-editor-type2" value="' + escapeMainHtml(data.type2) + '"></label>' +
      '<label>文案 2<input class="input-field" id="ft-editor-caption2" value="' + escapeMainHtml(data.caption2) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="ft-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="ft-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#ft-editor-cancel').addEventListener('click', close)
  ;[1, 2].forEach(function(n) {
    modal.querySelector('#ft-editor-pic-' + n).addEventListener('click', function() {
      window.showImagePicker(function(imageUrl) {
        data['pic' + n] = imageUrl
        var img = modal.querySelector('#ft-editor-pic-' + n + ' img')
        if (img) img.src = imageUrl
      })
    })
  })
  modal.querySelector('#ft-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      pic1: data.pic1,
      pic2: data.pic2,
      icon: modal.querySelector('#ft-editor-icon').value.trim() || '🍨',
      temp: modal.querySelector('#ft-editor-temp').value.trim() || '23°C',
      type1: modal.querySelector('#ft-editor-type1').value.trim() || 'Photo',
      caption1: modal.querySelector('#ft-editor-caption1').value.trim() || '유치한 놈 ㅋㅋ',
      type2: modal.querySelector('#ft-editor-type2').value.trim() || 'Music',
      caption2: modal.querySelector('#ft-editor-caption2').value.trim() || '🤍🖤ineedu...^'
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openMoodPostEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'mood-post') return
  var data = Object.assign({
    avatar: 'img/wanwan.png',
    title: 'Moonlight ✧˖°⋆✩',
    temp: '28°',
    pic1: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG',
    caption1: 'you have the sweetest soul I have ever seen.',
    pic2: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG',
    caption2: 'wish upon a star ⋆'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal'
  modal.style.zIndex = '241'
  var pickerHtml = [1, 2].map(function(n) {
    var url = data['pic' + n]
    return '<button class="tp-editor-photo" id="mp-editor-pic-' + n + '" type="button" aria-label="选择图片' + n + '">' +
      '<img src="' + escapeMainHtml(url) + '" alt="">' +
    '</button>'
  }).join('')
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar" id="mp-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="tp-editor-photos">' + pickerHtml + '</div>' +
    '<div class="angel-editor-form">' +
      '<label>标题<input class="input-field" id="mp-editor-title" value="' + escapeMainHtml(data.title) + '"></label>' +
      '<label>温度<input class="input-field" id="mp-editor-temp" value="' + escapeMainHtml(data.temp) + '"></label>' +
      '<label>文案 1<input class="input-field" id="mp-editor-caption1" value="' + escapeMainHtml(data.caption1) + '"></label>' +
      '<label>文案 2<input class="input-field" id="mp-editor-caption2" value="' + escapeMainHtml(data.caption2) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="mp-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="mp-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#mp-editor-cancel').addEventListener('click', close)
  modal.querySelector('#mp-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#mp-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  ;[1, 2].forEach(function(n) {
    modal.querySelector('#mp-editor-pic-' + n).addEventListener('click', function() {
      window.showImagePicker(function(imageUrl) {
        data['pic' + n] = imageUrl
        var img = modal.querySelector('#mp-editor-pic-' + n + ' img')
        if (img) img.src = imageUrl
      })
    })
  })
  modal.querySelector('#mp-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      avatar: data.avatar || 'img/wanwan.png',
      title: modal.querySelector('#mp-editor-title').value.trim() || 'Moonlight ✧˖°⋆✩',
      temp: modal.querySelector('#mp-editor-temp').value.trim() || '28°',
      pic1: data.pic1,
      pic2: data.pic2,
      caption1: modal.querySelector('#mp-editor-caption1').value.trim(),
      caption2: modal.querySelector('#mp-editor-caption2').value.trim()
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openThreadPostEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'thread-post') return
  var data = Object.assign({
    avatar: 'img/ava-00.jpg',
    name: 'Moonlight',
    time: '56m',
    text: '浅尝辄止 痛定思痛\nAm I not important in your heart...',
    pic: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG',
    likes: '99.0k'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-avatar-wrap">' +
      '<button class="angel-editor-avatar" id="tp-editor-avatar" type="button" aria-label="选择头像">' +
        '<img src="' + escapeMainHtml(data.avatar) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="tp-editor-photos">' +
      '<button class="tp-editor-photo" id="tp-editor-pic" type="button" aria-label="选择配图">' +
        '<img src="' + escapeMainHtml(data.pic) + '" alt="">' +
      '</button>' +
    '</div>' +
    '<div class="angel-editor-form">' +
      '<label>昵称<input class="input-field" id="tp-editor-name" value="' + escapeMainHtml(data.name) + '"></label>' +
      '<label>时间<input class="input-field" id="tp-editor-time" value="' + escapeMainHtml(data.time) + '"></label>' +
      '<label>正文<textarea class="input-field" id="tp-editor-text">' + escapeMainHtml(data.text) + '</textarea></label>' +
      '<label>点赞数<input class="input-field" id="tp-editor-likes" value="' + escapeMainHtml(data.likes) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="tp-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="tp-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#tp-editor-cancel').addEventListener('click', close)
  modal.querySelector('#tp-editor-avatar').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.avatar = imageUrl
      var img = modal.querySelector('#tp-editor-avatar img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#tp-editor-pic').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.pic = imageUrl
      var img = modal.querySelector('#tp-editor-pic img')
      if (img) img.src = imageUrl
    })
  })
  modal.querySelector('#tp-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      avatar: data.avatar || 'img/ava-00.jpg',
      name: modal.querySelector('#tp-editor-name').value.trim() || 'Moonlight',
      time: modal.querySelector('#tp-editor-time').value.trim() || '56m',
      text: modal.querySelector('#tp-editor-text').value,
      pic: data.pic,
      likes: modal.querySelector('#tp-editor-likes').value.trim()
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openPhotoBoardEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'photo-board') return
  var data = Object.assign({
    title: 'WanwanWorld',
    weather: '晴 26°C',
    label1: '#No.1',
    caption1: '思绪回到那天，你说永远不会分开',
    pic1: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260725/KjoH/1176X1173/PHB1.JPG',
    label2: '#No.2',
    caption2: '等你读懂我的隐喻',
    pic2: 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260725/zKzo/1176X1167/PHB2.JPG'
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal'
  modal.style.zIndex = '241'
  var pickerHtml = [1, 2].map(function(n) {
    return '<button class="tp-editor-photo" id="pb-editor-pic-' + n + '" type="button" aria-label="选择图片' + n + '">' +
      '<img src="' + escapeMainHtml(data['pic' + n]) + '" alt="">' +
    '</button>'
  }).join('')
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="tp-editor-photos">' + pickerHtml + '</div>' +
    '<div class="angel-editor-form">' +
      '<label>标题<input class="input-field" id="pb-editor-title" value="' + escapeMainHtml(data.title) + '"></label>' +
      '<label>天气<input class="input-field" id="pb-editor-weather" value="' + escapeMainHtml(data.weather) + '"></label>' +
      '<label>编号 1<input class="input-field" id="pb-editor-label1" value="' + escapeMainHtml(data.label1) + '"></label>' +
      '<label>文案 1<input class="input-field" id="pb-editor-caption1" value="' + escapeMainHtml(data.caption1) + '"></label>' +
      '<label>编号 2<input class="input-field" id="pb-editor-label2" value="' + escapeMainHtml(data.label2) + '"></label>' +
      '<label>文案 2<input class="input-field" id="pb-editor-caption2" value="' + escapeMainHtml(data.caption2) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="pb-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="pb-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#pb-editor-cancel').addEventListener('click', close)
  ;[1, 2].forEach(function(n) {
    modal.querySelector('#pb-editor-pic-' + n).addEventListener('click', function() {
      window.showImagePicker(function(imageUrl) {
        data['pic' + n] = imageUrl
        var img = modal.querySelector('#pb-editor-pic-' + n + ' img')
        if (img) img.src = imageUrl
      })
    })
  })
  modal.querySelector('#pb-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      title: modal.querySelector('#pb-editor-title').value.trim() || 'WanwanWorld',
      weather: modal.querySelector('#pb-editor-weather').value.trim(),
      label1: modal.querySelector('#pb-editor-label1').value.trim(),
      caption1: modal.querySelector('#pb-editor-caption1').value.trim(),
      pic1: data.pic1,
      label2: modal.querySelector('#pb-editor-label2').value.trim(),
      caption2: modal.querySelector('#pb-editor-caption2').value.trim(),
      pic2: data.pic2
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

function openDynamicCaptionEditor(widgetId) {
  var widget = _desktopWidgets.find(function(item) { return item.id === widgetId })
  if (!widget || widget.templateId !== 'dynamic-caption') return
  var data = Object.assign({
    title: '☆ ·u and me.★',
    subtitle: '於你而言我是一個星嗎',
    bgImage: ''
  }, widget.data || {})
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal dc-editor-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑组件</div>' +
    '<div class="angel-editor-form">' +
      '<label>背景图片<button class="angel-editor-bg-picker" id="dc-editor-bg-picker" type="button">' +
        '<span class="angel-editor-bg-preview dc-editor-bg-preview" id="dc-editor-bg-preview"' + (data.bgImage ? ' style="background-image:url(' + escapeMainHtml(data.bgImage) + ')"' : '') + '></span>' +
        '<span>' + (data.bgImage ? '更换背景' : '选择背景') + '</span>' +
      '</button></label>' +
      '<label>标题<input class="input-field" id="dc-editor-title" value="' + escapeMainHtml(data.title) + '"></label>' +
      '<label>文案<input class="input-field" id="dc-editor-subtitle" value="' + escapeMainHtml(data.subtitle) + '"></label>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="dc-editor-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="dc-editor-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.getElementById('app').appendChild(overlay)
  document.getElementById('app').appendChild(modal)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#dc-editor-cancel').addEventListener('click', close)
  modal.querySelector('#dc-editor-bg-picker').addEventListener('click', function() {
    window.showImagePicker(function(imageUrl) {
      data.bgImage = imageUrl
      var preview = modal.querySelector('#dc-editor-bg-preview')
      if (preview) preview.style.backgroundImage = 'url(' + imageUrl + ')'
      var label = modal.querySelector('#dc-editor-bg-picker span:last-child')
      if (label) label.textContent = '更换背景'
    })
  })
  modal.querySelector('#dc-editor-save').addEventListener('click', async function() {
    widget.data = Object.assign({}, widget.data || {}, {
      title: modal.querySelector('#dc-editor-title').value.trim() || '☆ ·u and me.★',
      subtitle: modal.querySelector('#dc-editor-subtitle').value.trim() || '於你而言我是一個星嗎',
      bgImage: data.bgImage || ''
    })
    await saveDesktopWidgets()
    var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
    if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    close()
  })
}

// 新建串组件用到的线性图标（fill 交给 currentColor，跟随主题）
var THREAD_POST_ICONS = {
  like: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 0 25 24" fill="currentColor" aria-label="赞"><path d="M16.5 2A6.38 6.38 0 0 0 12 3.937 6.38 6.38 0 0 0 7.5 2C3.379 2 .5 5.084.5 9.5c0 4.628 4.345 9.962 10.811 13.272a1.5 1.5 0 0 0 1.378 0C19.155 19.462 23.5 14.128 23.5 9.5 23.5 5.084 20.622 2 16.5 2ZM12 20.876C6.308 17.896 2.5 13.347 2.5 9.5 2.5 6.159 4.463 4 7.5 4c2 0 3.75 1.75 4.5 3.5C12.75 5.75 14.5 4 16.5 4c3.038 0 5 2.159 5 5.5 0 3.847-3.808 8.396-9.5 11.376Z"/></svg>',
  comment: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-label="评论"><path fill-rule="evenodd" d="M12 3a9 9 0 0 0 0 18 8.96 8.96 0 0 0 3.937-.904 1 1 0 0 1 .614-.086l4.206.752-.764-4.169a1 1 0 0 1 .086-.622A9 9 0 0 0 12 3ZM1 12C1 5.925 5.925 1 12 1s11 4.925 11 11a10.96 10.96 0 0 1-.982 4.549l.966 5.271a1 1 0 0 1-1.16 1.164l-5.312-.949A10.96 10.96 0 0 1 12 23C5.925 23 1 18.075 1 12Z"/></svg>',
  repost: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-label="转发"><path d="M4.516 6.999A9 9 0 0 1 20.293 8.497a1 1 0 1 0 1.842-.779A11 11 0 0 0 3 5.674V2.999a1 1 0 0 0-2 0v5a1 1 0 0 0 1 1h5a1 1 0 1 0 0-2H4.516Z"/><path d="M2.396 14.971a1 1 0 0 1 1.31.532A9 9 0 0 0 19.483 17H17a1 1 0 1 1 0-2h5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-2.675A11 11 0 0 1 1.864 16.282a1 1 0 0 1 .532-1.31Z"/></svg>',
  share: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-label="分享"><path fill-rule="evenodd" d="M7.247 1.499C4.183-.187.6 2.643 1.53 6.014L3.182 12 1.53 17.986c-.93 3.371 2.653 6.201 5.717 4.515l13.578-7.468c2.39-1.315 2.39-4.751 0-6.066L7.247 1.5ZM3.458 5.482c-.459-1.666 1.311-3.064 2.825-2.231l13.578 7.468c.14.078.262.173.364.281H4.98L3.458 5.482ZM4.98 13l-1.522 5.518c-.459 1.665 1.311 3.064 2.825 2.231l13.578-7.469c.14-.077.262-.172.364-.28H4.98Z"/></svg>',
  more: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-label="更多"><path d="M7 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM17 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"/><path fill-rule="evenodd" d="M12 1a11 11 0 1 1 0 22 11 11 0 0 1 0-22Zm0 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z"/></svg>',
  filter: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-label="筛选"><path d="M22.455 20.27a5 5 0 0 1-2.011 2.091l-.175.094c-.592.302-1.232.428-1.96.487-.718.059-1.606.058-2.71.058H8.4c-1.103 0-1.991.001-2.708-.058-.638-.052-1.208-.154-1.738-.381l-.223-.106a5 5 0 0 1-2.186-2.185l1.782-.908c.288.565.747 1.023 1.311 1.311l.103.049c.252.108.584.184 1.113.227.617.051 1.41.051 2.546.051h7.2c1.136 0 1.929 0 2.546-.051.605-.049.953-.142 1.216-.276l.206-.115c.47-.288.853-.701 1.105-1.196l1.782.908Z"/><path d="M15.6 1c1.103 0 1.991-.001 2.709.058.728.059 1.368.185 1.96.487l.175.094a5 5 0 0 1 2.011 2.091l.106.224c.227.529.329 1.1.381 1.737.059.718.058 1.606.058 2.71v7.199c0 1.103.001 1.991-.058 2.709-.059.728-.185 1.368-.487 1.96l-1.782-.907c.134-.263.227-.612.276-1.216.051-.617.051-1.41.051-2.546V8.4c0-1.136 0-1.929-.051-2.546-.043-.529-.119-.862-.227-1.113l-.049-.103a3 3 0 0 0-1.105-1.196l-.206-.115c-.263-.134-.611-.227-1.216-.276C17.529 3 16.736 3 15.6 3H8.4c-1.136 0-1.929 0-2.546.051-.605.049-.953.142-1.216.276l-.206.115a3 3 0 0 0-1.105 1.196l-.049.103c-.108.251-.184.584-.227 1.113C3 6.471 3 7.264 3 8.4v7.2c0 1.136 0 1.929.051 2.546.049.604.142.953.276 1.216l-1.782.907c-.302-.592-.428-1.232-.487-1.96C.999 17.591 1 16.703 1 15.6V8.4c0-1.103-.001-1.991.058-2.709.059-.728.185-1.368.487-1.96l.093-.175a5 5 0 0 1 2.091-2.011c.592-.302 1.233-.428 1.962-.487C6.408.999 7.297 1 8.4 1h7.2Z"/><path d="M8.006 6.006a1 1 0 0 1 1 1V13H10a1 1 0 1 1 0 2h-.994v2.006a1 1 0 0 1-2 0V15H6a1 1 0 1 1 0-2h1.006V7.006a1 1 0 0 1 1-1ZM16.006 6.006a1 1 0 0 1 1 1V9H18a1 1 0 1 1 0 2h-.994v6.006a1 1 0 0 1-2 0V11H14a1 1 0 1 1 0-2h1.006V7.006a1 1 0 0 1 1-1Z"/></svg>',
  dots: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-label="更多"><path d="M7 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM17 10.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z"/></svg>'
}

var PHOTO_BOARD_ICONS = {
  search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-label="搜索"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/></svg>',
  dots: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-label="更多"><path d="M5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM19 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z"/></svg>',
  edit: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-label="编辑"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M14.5 6.5l3 3"/></svg>',
  menu: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-label="菜单"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
}

function buildDesktopWidgetInner(widget) {
  var data = widget.data || {}
  if (widget.templateId === 'top') {
    var topTitle = data.title === '@XinYue.zzz' ? '@WanWan.zzz' : (data.title || '@WanWan.zzz')
    var topSubtext = data.subtext === '某年某月某个星期几°˙♡' ? '某年某月某个星期几' : (data.subtext || '某年某月某个星期几')
    var topAvatar = data.avatar || 'img/ava-00.jpg'
    return '<div class="widget-avatar"><img class="widget-avatar-img" src="' + escapeMainHtml(topAvatar) + '" alt=""><span class="widget-avatar-wechat"><i class="fa-brands fa-weixin"></i></span></div><div class="widget-text"><div class="widget-title">' + escapeMainHtml(topTitle) + '</div><div class="widget-subtext">' + escapeMainHtml(topSubtext) + '</div></div><div class="widget-badge" id="widget-badge">99+</div>'
  }
  if (widget.templateId === 'text-mood') {
    return '<div class="text-mood-left"><div class="text-mood-title">' + escapeMainHtml(data.title || '💭·🍶날씨가 추워.') + '</div><div class="text-mood-sub">' + escapeMainHtml(data.subtext || '萌萌之中早已注定') + '</div></div><div class="text-mood-date">' + new Date().getDate() + '</div>'
  }
  if (widget.templateId === 'chat-bubble') {
    var rightAvatar = data.rightAvatar || 'img/ava-01.jpg'
    var leftAvatar = data.leftAvatar || 'img/ava-02.jpg'
    return '<div class="chat-bubble-row chat-bubble-right"><div class="chat-bubble-msg chat-bubble-msg-right"><span class="chat-bubble-text">' + escapeMainHtml(data.right || '我讨厌你') + '</span></div><img class="chat-bubble-avatar" src="' + escapeMainHtml(rightAvatar) + '" alt=""></div><div class="chat-bubble-row chat-bubble-left"><img class="chat-bubble-avatar" src="' + escapeMainHtml(leftAvatar) + '" alt=""><div class="chat-bubble-msg chat-bubble-msg-left"><span class="chat-bubble-text">' + escapeMainHtml(data.left || '我知道，我也爱你') + '</span></div></div>'
  }
  if (widget.templateId === 'angel-status') {
    var avatar = data.avatar || 'img/ava-00.jpg'
    var topBgImage = data.topBgImage || ''
    return '<div class="angel-status-top"' + (topBgImage ? ' style="--angel-top-image:url(' + escapeMainHtml(topBgImage) + ')"' : '') + '>' +
      '<div class="angel-avatar-card"><img src="' + escapeMainHtml(avatar) + '" alt=""></div>' +
      '<div class="angel-status-main"><div class="angel-status-title">' + escapeMainHtml(data.title || '爱上一个天使的缺点') + '</div><div class="angel-status-handle">' + escapeMainHtml(data.handle || '@Wanwan_046') + '</div></div>' +
      '<div class="angel-status-date">' + escapeMainHtml(formatAngelStatusDate(new Date())) + '</div>' +
      '</div><span class="angel-status-triangle"></span><div class="angel-status-bubble"><span class="angel-status-message">' + escapeMainHtml(data.message || '你對我來說是宇宙，但我對你來說只是一顆星嗎？') + '</span></div>'
  }
  if (widget.templateId === 'profile') {
    var profileAvatar = data.avatar || 'img/ava-00.jpg'
    var coverImage = data.coverImage || ''
    return '<div class="profile-widget-cover"' + (coverImage ? ' style="--profile-cover-image:url(' + escapeMainHtml(coverImage) + ')"' : '') + '></div><div class="profile-widget-body"><div class="profile-name">' + escapeMainHtml(data.name || '弯弯O.o') + '</div><div class="profile-location-pill"><i class="fa fa-location-dot"></i><span>' + escapeMainHtml(data.location || 'Seoul') + '</span></div></div><div class="profile-avatar-ring"><img class="profile-avatar-img" src="' + escapeMainHtml(profileAvatar) + '" alt=""></div>'
  }
  if (widget.templateId === 'music') {
    var musicCover = data.cover || 'img/wanwan.png'
    var musicLyrics = data.lyrics || data.artist || '和你one to one愛開始擴散'
    var currentTime = data.currentTime || '1:28'
    var totalTime = data.totalTime || '5:20'
    var progress = getMusicProgressPercent(currentTime, totalTime).toFixed(2)
    return '<div class="music-top-row"><div class="music-album-art"><img src="' + escapeMainHtml(musicCover) + '" alt=""></div><div class="music-play-btn"><i class="fa-solid fa-circle-play"></i></div></div><div class="music-title">' + escapeMainHtml(data.title || 'Always Online') + '</div><div class="music-artist">' + escapeMainHtml(musicLyrics) + '</div><div class="music-progress-area"><div class="music-progress-bar"><div class="music-progress-fill" style="width:' + progress + '%"></div><div class="music-progress-dot" style="left:' + progress + '%"></div></div><div class="music-times"><span>' + escapeMainHtml(currentTime) + '</span><span>' + escapeMainHtml(totalTime) + '</span></div></div>'
  }
  if (widget.templateId === 'couple') {
    var coupleAvatar1 = data.avatar1 || 'img/ava-01.jpg'
    var coupleAvatar2 = data.avatar2 || 'img/ava-02.jpg'
    var coupleName1 = data.name1 === '月亮O.o' ? '弯弯O.o' : (data.name1 || '弯弯O.o')
    var coupleBubbleLeft = data.bubbleLeft || '你在左边'
    var coupleBubbleRight = data.bubbleRight || '我靠近右'
    var coupleDays = data.countMode === 'anniversary' ? coupleDaysSince(data.anniversary) : null
    var coupleCount = coupleDays !== null ? String(coupleDays) : (data.count || '520')
    return '<div class="couple-bubbles-row"><div class="couple-bubble-item couple-bubble-left-note"><span>' + escapeMainHtml(coupleBubbleLeft) + '</span></div><div class="couple-bubble-item couple-bubble-right-note"><span>' + escapeMainHtml(coupleBubbleRight) + '</span></div></div><div class="couple-avatars-main"><div class="circle-photo"><div class="img-ring"><img class="img" src="' + escapeMainHtml(coupleAvatar1) + '" alt=""></div><div class="name">' + escapeMainHtml(coupleName1) + '</div></div><div class="couple-ekg"><svg viewBox="0 0 64 22" preserveAspectRatio="none"><polyline points="0,11 6,11 9,14 13,8 17,11 21,11 25,2 31,20 35,11 64,11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></div><div class="circle-photo"><div class="img-ring"><img class="img" src="' + escapeMainHtml(coupleAvatar2) + '" alt=""></div><div class="name">' + escapeMainHtml(data.name2 || '小狗神') + '</div></div></div><div class="couple-days-area"><div class="couple-days-label">正式在一起已经</div><div class="couple-days-value">' + escapeMainHtml(coupleCount) + ' days</div></div>'
  }
  if (widget.templateId === 'calendar') {
    var calAvatar = data.avatar || 'img/ava-00.jpg'
    var calUsername = data.username || '弯弯O.o'
    var calNow = new Date()
    var calDay = calNow.getDay()
    var calWeekStart = new Date(calNow)
    calWeekStart.setDate(calNow.getDate() - calDay)
    var calWeekEnd = new Date(calWeekStart)
    calWeekEnd.setDate(calWeekStart.getDate() + 6)
    var calMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    var calRangeLabel = calWeekStart.getMonth() === calWeekEnd.getMonth()
      ? calMonthNames[calWeekStart.getMonth()] + ' ' + calWeekStart.getDate() + ' - ' + calWeekEnd.getDate()
      : calMonthNames[calWeekStart.getMonth()] + ' ' + calWeekStart.getDate() + ' - ' + calMonthNames[calWeekEnd.getMonth()] + ' ' + calWeekEnd.getDate()
    var calDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    var calDaysHtml = ''
    for (var ci = 0; ci < 7; ci++) {
      var calD = new Date(calWeekStart)
      calD.setDate(calWeekStart.getDate() + ci)
      var calIsToday = ci === calDay
      var calSatClass = ci === 6 ? ' cal-sat' : ''
      calDaysHtml += '<div class="cal-day-col' + calSatClass + '">' +
        '<div class="cal-day-label' + (calIsToday ? ' cal-today-label' : '') + '">' + calDayLabels[ci] + '</div>' +
        '<div class="cal-day-num' + (calIsToday ? ' cal-today' : '') + '">' + calD.getDate() + '</div>' +
        '</div>'
    }
    return '<div class="cal-header"><div class="cal-user"><img class="cal-avatar" src="' + escapeMainHtml(calAvatar) + '" alt=""><span class="cal-username">' + escapeMainHtml(calUsername) + '</span></div><div class="cal-following-pill">FOLLOWING</div></div>' +
      '<div class="cal-range-row"><span class="cal-arrow cal-arrow-left"><i class="fa fa-angle-left"></i></span><span class="cal-range-label">' + escapeMainHtml(calRangeLabel) + '</span><span class="cal-arrow cal-arrow-right"><i class="fa fa-angle-right"></i></span></div>' +
      '<div class="cal-week-row">' + calDaysHtml + '</div>'
  }
  if (widget.templateId === 'bio-card') {
    var bioAvatar = data.avatar || 'img/ava-00.jpg'
    var bioName = data.name === '月亮O.o' ? '弯弯O.o' : (data.name || '弯弯O.o')
    var bioCoverImage = data.coverImage || ''
    return '<div class="bio-cover"' + (bioCoverImage ? ' style="--bio-cover-image:url(' + escapeMainHtml(bioCoverImage) + ')"' : '') + '></div><div class="bio-avatar-wrap"><div class="bio-avatar"><img src="' + escapeMainHtml(bioAvatar) + '" alt=""></div></div><div class="bio-name">' + escapeMainHtml(bioName) + '</div><div class="bio-quote"><i class="fa-solid fa-quote-left bio-quote-mark"></i><span>' + escapeMainHtml(data.quote || '매일매일 조금이라도 행복하자. 💡') + '</span><i class="fa-solid fa-quote-right bio-quote-mark"></i></div>'
  }
  if (widget.templateId === 'homepage') {
    var hpAvatar = data.avatar || 'img/ava-00.jpg'
    var hpName = data.name || '弯弯O.o'
    var hpHandle = data.handle || '@wanwan_046'
    var hpTags = data.tags || '我 和 你'
    var hpOnline = data.online !== false
    var hpTagsHtml = hpTags.split(/\s+/).filter(function(t) { return t }).map(function(t) {
      return '<span class="hp-tag">' + escapeMainHtml(t) + '</span>'
    }).join('')
    return (hpOnline ? '<div class="hp-online"><span class="hp-online-dot"></span>online</div>' : '') +
      '<div class="hp-avatar-wrap"><img class="hp-avatar-img" src="' + escapeMainHtml(hpAvatar) + '" alt=""></div>' +
      '<div class="hp-name">' + escapeMainHtml(hpName) + '</div>' +
      '<div class="hp-handle">' + escapeMainHtml(hpHandle) + '</div>' +
      '<div class="hp-tags">' + hpTagsHtml + '</div>'
  }
  if (widget.templateId === 'send-board') {
    var sbAvatar = data.avatar || 'img/ava-00.jpg'
    return '<div class="sb-header">' + escapeMainHtml(data.header || '보내기 ♡') + '</div>' +
      '<div class="sb-user-row">' +
        '<img class="sb-avatar" src="' + escapeMainHtml(sbAvatar) + '" alt="">' +
        '<span class="sb-name">' + escapeMainHtml(data.name || '디저트') + '</span>' +
        '<span class="sb-chevron"><i class="fa fa-angle-right"></i></span>' +
      '</div>' +
      '<div class="sb-row sb-row-first">' +
        '<span class="sb-row-text">' + escapeMainHtml(data.line1 || '고생 끝에 낙이 온다') + '</span>' +
        '<span class="sb-row-accent">' + escapeMainHtml(data.line1Right || '슬프다') + '</span>' +
      '</div>' +
      '<div class="sb-input-row">' +
        '<div class="sb-row sb-row-input"><span class="sb-row-text sb-input-text">' + escapeMainHtml(data.line2 || 'kunoouc') + '</span></div>' +
        '<span class="sb-send-btn"><i class="fa-solid fa-paper-plane"></i></span>' +
      '</div>'
  }
  if (widget.templateId === 'three-pics') {
    var tpPic1 = data.pic1 || 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG'
    var tpPic2 = data.pic2 || 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG'
    var tpPic3 = data.pic3 || 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/m2yV/1077X1076/BG_03.JPG'
    return '<div class="tp-photos">' +
        '<div class="tp-photo"><img src="' + escapeMainHtml(tpPic1) + '" alt=""></div>' +
        '<div class="tp-photo"><img src="' + escapeMainHtml(tpPic2) + '" alt=""></div>' +
        '<div class="tp-photo"><img src="' + escapeMainHtml(tpPic3) + '" alt=""></div>' +
      '</div>' +
      '<div class="tp-badges">' +
        '<span class="tp-badge"><i class="fa-solid fa-display"></i>' + escapeMainHtml(data.label || '3Pics') + '</span>' +
        '<span class="tp-badge tp-badge-mini">' + escapeMainHtml(data.tag || '·ㅈ·') + '</span>' +
      '</div>'
  }
  if (widget.templateId === 'file-type') {
    var ftPic1 = data.pic1 || 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG'
    var ftPic2 = data.pic2 || 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG'
    var ftNow = new Date()
    var ftDate = String(ftNow.getFullYear()).slice(-2) + '-' + String(ftNow.getMonth() + 1).padStart(2, '0') + '-' + String(ftNow.getDate()).padStart(2, '0')
    var ftItem = function(pic, type, caption) {
      return '<div class="ft-item">' +
        '<div class="ft-photo"><img src="' + escapeMainHtml(pic) + '" alt=""></div>' +
        '<div class="ft-type"><span class="ft-type-dot"></span>filetype：' + escapeMainHtml(type) + '</div>' +
        '<div class="ft-caption">' + escapeMainHtml(caption) + '</div>' +
      '</div>'
    }
    return '<div class="ft-left">' +
        '<div class="ft-wing"><span class="ft-wing-icon">' + escapeMainHtml(data.icon || '🍨') + '</span></div>' +
        '<div class="ft-meta">' +
          '<div class="ft-temp"><span class="ft-dot"></span>' + escapeMainHtml(data.temp || '23°C') + '</div>' +
          '<div class="ft-date"><span class="ft-dot ft-dot-small"></span>' + escapeMainHtml(ftDate) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="ft-card">' +
        ftItem(ftPic1, data.type1 || 'Photo', data.caption1 || '유치한 놈 ㅋㅋ') +
        ftItem(ftPic2, data.type2 || 'Music', data.caption2 || '🤍🖤ineedu...^') +
      '</div>'
  }
  if (widget.templateId === 'mood-post') {
    var mpAvatar = data.avatar || 'img/wanwan.png'
    var mpTitle = data.title || 'Moonlight ✧˖°⋆✩'
    var mpTemp = data.temp || '28°'
    var mpPic1 = data.pic1 || 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/XNhs/1065X1065/BG_01.JPG'
    var mpPic2 = data.pic2 || 'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/GIsD/1077X1076/BG_04.JPG'
    var mpCaption1 = data.caption1 || ''
    var mpCaption2 = data.caption2 || ''
    var mpPhoto = function(pic, caption) {
      return '<div class="mp-photo">' +
        '<img src="' + escapeMainHtml(pic) + '" alt="">' +
        (caption ? '<div class="mp-caption">' + escapeMainHtml(caption) + '</div>' : '') +
      '</div>'
    }
    return '<div class="mp-header">' +
        '<div class="mp-avatar"><img src="' + escapeMainHtml(mpAvatar) + '" alt=""></div>' +
        '<div class="mp-title">' + escapeMainHtml(mpTitle) + '</div>' +
        '<div class="mp-temp">' + escapeMainHtml(mpTemp) + '</div>' +
      '</div>' +
      '<div class="mp-photos">' +
        mpPhoto(mpPic1, mpCaption1) +
        mpPhoto(mpPic2, mpCaption2) +
      '</div>'
  }
  if (widget.templateId === 'dynamic-caption') {
    var dcBgImage = data.bgImage ||'https://img2.tofaka.com/autoupload/WyM1lZ85VwHzLwMUY9JmtdiO_OyvX7mIgxFBfDMDErs/20260619/Qact/1077X1076/BG_05.JPG'
    var dcTitle = data.title || '☆ ·u and me.★'
    var dcSubtitle = data.subtitle || '於你而言我是一個星嗎'
    return '<div class="dc-cover"' + (dcBgImage ? ' style="--dc-bg-image:url(' + escapeMainHtml(dcBgImage) + ')"' : '') + '></div>' +
      '<div class="dc-content">' +
        '<div class="dc-title">' + escapeMainHtml(dcTitle) + '</div>' +
        '<div class="dc-subtitle">' + escapeMainHtml(dcSubtitle) + '</div>' +
      '</div>'
  }
  if (widget.templateId === 'thread-post') {
    var tpAvatar = data.avatar || 'img/ava-00.jpg'
    var tpName = data.name || 'Moonlight'
    var tpTime = data.time || '56m'
    var tpText = data.text === undefined ? '浅尝辄止 痛定思痛\nAm I not important in your heart...' : data.text
    var tpPic = data.pic || ''
    var tpLikes = data.likes || ''
    return '<div class="tpw-topbar">' +
        '<span class="tpw-cancel">取消</span>' +
        '<span class="tpw-topbar-title">新建串文</span>' +
        '<span class="tpw-topbar-actions">' + THREAD_POST_ICONS.filter + THREAD_POST_ICONS.more + '</span>' +
      '</div>' +
      '<div class="tpw-body">' +
        '<div class="tpw-rail">' +
          '<div class="tpw-avatar"><img src="' + escapeMainHtml(tpAvatar) + '" alt=""></div>' +
          '<div class="tpw-line"></div>' +
        '</div>' +
        '<div class="tpw-main">' +
          '<div class="tpw-head">' +
            '<span class="tpw-name">' + escapeMainHtml(tpName) + '</span>' +
            '<span class="tpw-time">' + escapeMainHtml(tpTime) + '</span>' +
            '<span class="tpw-dots">' + THREAD_POST_ICONS.dots + '</span>' +
          '</div>' +
          (tpText ? '<div class="tpw-text">' + escapeMainHtml(tpText).replace(/\n/g, '<br>') + '</div>' : '') +
          (tpPic ? '<div class="tpw-pic"><img src="' + escapeMainHtml(tpPic) + '" alt=""></div>' : '') +
          '<div class="tpw-actions">' + THREAD_POST_ICONS.like + THREAD_POST_ICONS.comment + THREAD_POST_ICONS.repost + THREAD_POST_ICONS.share + '</div>' +
          (tpLikes ? '<div class="tpw-likes">' + escapeMainHtml(tpLikes) + ' 个赞</div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="tpw-reply">' +
        '<div class="tpw-reply-rail"><div class="tpw-avatar tpw-avatar-sm"><img src="' + escapeMainHtml(tpAvatar) + '" alt=""></div></div>' +
        '<div class="tpw-reply-input"><span>添加回复...</span></div>' +
      '</div>'
  }
  if (widget.templateId === 'photo-board') {
    var pbTitle = data.title || 'WanwanWorld'
    var pbWeather = data.weather || ''
    var pbRow = function(pic, label, caption) {
      return '<div class="pb-row">' +
        '<div class="pb-thumb">' + (pic ? '<img src="' + escapeMainHtml(pic) + '" alt="">' : '') + '</div>' +
        '<div class="pb-row-main">' +
          '<div class="pb-row-head">' +
            '<span class="pb-label">' + escapeMainHtml(label || '') + '</span>' +
            '<span class="pb-row-icons">' + PHOTO_BOARD_ICONS.dots + PHOTO_BOARD_ICONS.edit + '</span>' +
          '</div>' +
          (caption ? '<div class="pb-caption">' + escapeMainHtml(caption) + '</div>' : '') +
        '</div>' +
      '</div>'
    }
    return '<div class="pb-header">' +
        '<span class="pb-search">' + PHOTO_BOARD_ICONS.search + '</span>' +
        '<div class="pb-title">' + escapeMainHtml(pbTitle) + '</div>' +
        '<span class="pb-weekday">' + escapeMainHtml(formatPhotoBoardWeekday(new Date())) + '</span>' +
      '</div>' +
      '<div class="pb-rows">' +
        pbRow(data.pic1, data.label1 || '#No.1', data.caption1 === undefined ? '思绪回到那天，你说永远不会分开' : data.caption1) +
        pbRow(data.pic2, data.label2 || '#No.2', data.caption2 === undefined ? '等你读懂我的隐喻' : data.caption2) +
      '</div>' +
      '<div class="pb-footer">' +
        '<span class="pb-weather">' + escapeMainHtml(pbWeather) + '</span>' +
        '<span class="pb-footer-right">' +
          '<span class="pb-date">' + escapeMainHtml(formatPhotoBoardDate(new Date())) + '</span>' +
          '<span class="pb-menu">' + PHOTO_BOARD_ICONS.menu + '</span>' +
        '</span>' +
      '</div>'
  }
  if (widget.templateId === 'custom-html') {
    return buildCustomHtmlWidgetInner(widget)
  }
  return '<div class="custom-widget-title">' + escapeMainHtml(data.title || '自定义组件') + '</div><div class="custom-widget-sub">' + escapeMainHtml(data.subtext || 'Custom Style') + '</div>'
}

// ===== 自定义 HTML 组件：占位符 {avatar:名称} / {text:名称} =====
function parseCustomHtmlSlots(html) {
  var slots = []
  var seen = {}
  var re = /\{(avatar|text):([^{}]+?)\}/g
  var match
  while ((match = re.exec(String(html || ''))) !== null) {
    var key = match[1] + ':' + match[2]
    if (seen[key]) continue
    seen[key] = true
    slots.push({ kind: match[1], name: match[2] })
  }
  return slots
}

function sanitizeCustomWidgetHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

function buildCustomHtmlWidgetInner(widget) {
  var data = widget.data || {}
  var values = data.values || {}
  var html = sanitizeCustomWidgetHtml(data.html)
  return html.replace(/\{(avatar|text):([^{}]+?)\}/g, function(_, kind, name) {
    var value = values[name]
    if (kind === 'avatar') return escapeMainHtml(value || 'img/ava-00.jpg')
    return escapeMainHtml(value || name)
  })
}

function updateDesktopGridMetrics() {
  var viewport = document.getElementById('desktop-viewport')
  if (!viewport) return
  var dock = document.getElementById('dock-area')
  var editBar = document.querySelector('.desktop-edit-bar')
  if (dock) dock.style.display = 'none'
  if (editBar) editBar.style.display = 'none'
  var viewportHeight = viewport.getBoundingClientRect().height
  if (dock) dock.style.display = ''
  if (editBar) editBar.style.display = ''
  var sample = document.createElement('button')
  sample.className = 'app-icon desktop-measure-icon'
  sample.innerHTML = '<div class="icon-bg"></div><span class="icon-label">测试</span>'
  viewport.appendChild(sample)
  var iconHeight = Math.ceil(sample.getBoundingClientRect().height) || 88
  sample.remove()
  var paddingY = 32
  var rowGap = 20
  var usableHeight = Math.max(0, viewportHeight - paddingY)
  var rows = Math.max(3, Math.floor((usableHeight + rowGap) / (iconHeight + rowGap)))
  _desktopGridRows = rows
  _desktopSlotsPerPage = rows * DESKTOP_GRID_COLS
  document.documentElement.style.setProperty('--desktop-grid-rows', String(rows))
}

function bindDesktopPageDot(dot) {
  dot.addEventListener('click', function() {
    switchDesktopPage(parseInt(dot.dataset.page, 10) || 0)
  })
}

function createDesktopPageElement(page, index) {
  var pageEl = document.createElement('div')
  pageEl.className = 'desktop-page'
  pageEl.style.setProperty('--desktop-grid-rows', String(_desktopGridRows))
  if (_desktopEditing && !pageHasIcons(page)) pageEl.classList.add('desktop-page-empty')
  pageEl.id = 'desktop-page-' + index
  pageEl.dataset.page = String(index)
  return pageEl
}

function createDesktopPageDot(index) {
  var dot = document.createElement('span')
  dot.className = 'dot'
  dot.dataset.page = String(index)
  return dot
}

function syncDesktopPageDom() {
  var wrapper = document.getElementById('desktop-wrapper')
  var dots = document.getElementById('page-dots')
  var layout = ensureDesktopLayout()
  if (!wrapper || !dots) return
  for (var i = wrapper.children.length; i < layout.pages.length; i++) {
    wrapper.appendChild(createDesktopPageElement(layout.pages[i], i))
    var dot = createDesktopPageDot(i)
    dots.appendChild(dot)
    bindDesktopPageDot(dot)
    renderIcons(i)
  }
  updateDesktopPageEmptyStates()
}

function updateDesktopPageEmptyStates() {
  var layout = ensureDesktopLayout()
  document.querySelectorAll('.desktop-page').forEach(function(pageEl) {
    var index = parseInt(pageEl.dataset.page, 10) || 0
    pageEl.classList.toggle('desktop-page-empty', _desktopEditing && !pageHasIcons(layout.pages[index]))
  })
}

function attachDesktopWidgetRemoveButton(widgetEl) {
  if (!widgetEl || widgetEl.querySelector('.desktop-widget-remove')) return
  var removeBtn = document.createElement('button')
  removeBtn.className = 'desktop-widget-remove'
  removeBtn.type = 'button'
  removeBtn.setAttribute('aria-label', '删除组件')
  removeBtn.innerHTML = '<i class="fa fa-xmark"></i>'
  removeBtn.addEventListener('pointerdown', function(e) {
    e.stopPropagation()
  })
  removeBtn.addEventListener('click', function(e) {
    e.preventDefault()
    e.stopPropagation()
    removeDesktopWidget(this.closest('.desktop-widget').dataset.id)
  })
  widgetEl.appendChild(removeBtn)
}

// ===== 渲染桌面图标 =====
function renderIcons(page) {
  var container = document.getElementById('desktop-page-' + page)
  if (!container) return
  container.innerHTML = ''
  var slots = getPageSlots(ensureDesktopLayout().pages[page])
  for (var i = 0; i < _desktopSlotsPerPage; i++) {
    var id = slots[i] || null
    if (id && slots.indexOf(id) !== i) continue
    var slot = document.createElement('div')
    slot.className = 'desktop-slot'
    slot.dataset.page = String(page)
    slot.dataset.slot = String(i)
    slot.style.gridColumnStart = String((i % DESKTOP_GRID_COLS) + 1)
    slot.style.gridRowStart = String(Math.floor(i / DESKTOP_GRID_COLS) + 1)
    if (!id) {
      container.appendChild(slot)
      continue
    }
    var item = getDesktopItem(id)
    if (!item) {
      container.appendChild(slot)
      continue
    }
    if (item.type === 'widget') {
      var size = getDesktopItemSize(id)
      var widgetEl = document.createElement('div')
      slot.classList.add('desktop-widget-slot')
      if ((i % DESKTOP_GRID_COLS) + size.cols > DESKTOP_GRID_COLS) {
        slot.style.gridColumnStart = '1'
      }
      slot.style.gridColumnEnd = 'span ' + size.cols
      slot.style.gridRowEnd = 'span ' + size.rows
      widgetEl.className = 'desktop-widget ' + (item.className || '')
      widgetEl.dataset.id = item.id
      widgetEl.dataset.area = 'desktop'
      widgetEl.dataset.page = String(page)
      widgetEl.dataset.slot = String(i)
      if (item.accent) widgetEl.style.setProperty('--widget-accent', item.accent)
      if (item.background) widgetEl.style.setProperty('--widget-bg', item.background)
      widgetEl.innerHTML = buildDesktopWidgetInner(item)
      if (item.templateId === 'top' || item.templateId === 'text-mood' || item.templateId === 'angel-status' || item.templateId === 'chat-bubble' || item.templateId === 'profile' || item.templateId === 'music' || item.templateId === 'couple' || item.templateId === 'bio-card' || item.templateId === 'calendar' || item.templateId === 'homepage' || item.templateId === 'dynamic-caption' || item.templateId === 'send-board' || item.templateId === 'three-pics' || item.templateId === 'file-type' || item.templateId === 'mood-post' || item.templateId === 'thread-post' || item.templateId === 'photo-board' || item.templateId === 'custom-html') {
        widgetEl.addEventListener('click', function(e) {
          if (_desktopEditing || this.dataset.suppressClick === '1') {
            e.preventDefault()
            return
          }
          var clickedWidget = getDesktopItem(this.dataset.id)
          if (clickedWidget && clickedWidget.templateId === 'top') openTopWidgetEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'text-mood') openTextMoodWidgetEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'chat-bubble') openChatBubbleEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'profile') openProfileWidgetEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'music') openMusicWidgetEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'couple') openCoupleWidgetEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'bio-card') openBioCardEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'calendar') openCalendarWidgetEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'homepage') openHomepageWidgetEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'dynamic-caption') openDynamicCaptionEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'send-board') openSendBoardEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'three-pics') openThreePicsEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'file-type') openFileTypeEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'mood-post') openMoodPostEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'thread-post') openThreadPostEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'photo-board') openPhotoBoardEditor(this.dataset.id)
          else if (clickedWidget && clickedWidget.templateId === 'custom-html') openCustomHtmlWidgetEditor(this.dataset.id)
          else openAngelStatusEditor(this.dataset.id)
        })
      }
      if (_desktopEditing) {
        attachDesktopWidgetRemoveButton(widgetEl)
      }
      bindEditableIcon(widgetEl)
      slot.appendChild(widgetEl)
      container.appendChild(slot)
      continue
    }
    var el = document.createElement('button')
    el.className = 'app-icon'
    el.dataset.id = item.id
    el.dataset.area = 'desktop'
    el.dataset.page = String(page)
    el.dataset.slot = String(i)
    el.innerHTML = buildDesktopIconButton(item, 'desktop')
    el.addEventListener('click', function(e) {
      if (_desktopEditing || this.dataset.suppressClick === '1') {
        e.preventDefault()
        return
      }
      var clicked = getDesktopItem(this.dataset.id)
      if (clicked) clicked.action()
    })
    bindEditableIcon(el)
    slot.appendChild(el)
    container.appendChild(slot)
  }
}

// ===== 渲染桌面DOM =====
function renderDesktop() {
  var app = document.getElementById('app')
  app.innerHTML = ''
  var layout = ensureDesktopLayout()
  TOTAL_PAGES = layout.pages.length
  var home = document.createElement('div')
  home.id = 'home-page'
  if (_homeWallpaperData) {
    home.style.backgroundImage = 'url(' + _homeWallpaperData + ')'
    home.classList.add('has-wallpaper')
  }
  applyDesktopLabelColor(home)
  if (_desktopEditing) home.classList.add('desktop-editing')
  home.innerHTML =
    '<div class="status-bar"></div>' +
    '<div class="desktop-edit-bar">' +
      '<button id="desktop-add-widget">添加组件</button>' +
      '<button id="desktop-edit-done">完成</button>' +
    '</div>' +
    '<div class="desktop-viewport" id="desktop-viewport">' +
      '<div class="desktop-wrapper" id="desktop-wrapper"></div>' +
    '</div>' +
    '<div class="page-dots" id="page-dots"></div>' +
    '<div class="dock-area" id="dock-area"></div>'
  app.appendChild(home)
  updateDesktopGridMetrics()
  _desktopLayout = normalizeDesktopLayout(_desktopLayout, _desktopEditing)
  layout = ensureDesktopLayout()
  TOTAL_PAGES = layout.pages.length
  renderDesktopPages()
  renderDock()
  for (var i = 0; i < TOTAL_PAGES; i++) renderIcons(i)
  bindPageDots()
  bindDesktopSwipe()
  bindDesktopEditChrome()
  bindDesktopResize()
  switchDesktopPage(Math.min(currentPage, TOTAL_PAGES - 1), true)
}

function bindDesktopResize() {
  if (_desktopResizeBound) return
  _desktopResizeBound = true
  var resizeTimer = 0
  var lastResizeWidth = window.innerWidth
  window.addEventListener('resize', function() {
    if (!_appStarted) return
    var nextWidth = window.innerWidth
    var widthChanged = nextWidth !== lastResizeWidth
    lastResizeWidth = nextWidth
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(function() {
      var active = document.activeElement
      var isTextEditing = active && (
        active.matches('input, textarea, select') ||
        active.isContentEditable ||
        (active.closest && active.closest('[contenteditable="true"]'))
      )
      if (isTextEditing) return
      if (document.querySelector('#app > .full-page')) return
      if (!document.getElementById('home-page')) return
      if (!widthChanged && !_desktopEditing) return
      cleanDesktopPages()
      if (_desktopEditing) ensureEditableTrailingPage()
      renderDesktop()
    }, 120)
  }, { passive: true })
}

function renderDesktopPages() {
  var wrapper = document.getElementById('desktop-wrapper')
  var dots = document.getElementById('page-dots')
  var layout = ensureDesktopLayout()
  if (!wrapper || !dots) return
  wrapper.innerHTML = ''
  dots.innerHTML = ''
  layout.pages.forEach(function(page, index) {
    wrapper.appendChild(createDesktopPageElement(page, index))
    dots.appendChild(createDesktopPageDot(index))
  })
}

// ===== 绑定页面指示点点击 =====
function bindPageDots() {
  document.querySelectorAll('#page-dots .dot').forEach(function(dot) {
    bindDesktopPageDot(dot)
  })
}

// ===== 渲染Dock栏 =====
function renderDock() {
  var dockArea = document.getElementById('dock-area')
  if (!dockArea) return
  dockArea.innerHTML = '<div class="dock-glass" id="dock"></div>'
  var dock = dockArea.querySelector('#dock')
  var dockIds = ensureDesktopLayout().dock
  dockArea.classList.toggle('dock-empty', dockIds.length === 0)
  dockIds.forEach(function(id) {
    var item = getDesktopItem(id)
    if (!item) return
    var btn = document.createElement('button')
    btn.className = 'dock-item'
    btn.dataset.id = item.id
    btn.dataset.area = 'dock'
    btn.innerHTML = buildDesktopIconButton(item, 'dock')
    btn.addEventListener('click', function(e) {
      if (_desktopEditing || btn.dataset.suppressClick === '1') {
        e.preventDefault()
        return
      }
      item.action()
    })
    bindEditableIcon(btn)
    dock.appendChild(btn)
  })
}

// ===== 多页桌面滑动 =====
var currentPage = 0
var TOTAL_PAGES = 2
var _desktopPageTransitionTimer = 0

function activateDesktopEditModeInPlace() {
  if (_desktopEditing) return
  _desktopEditing = true
  var homePage = document.getElementById('home-page')
  if (homePage) homePage.classList.add('desktop-editing')
  ensureEditableTrailingPage()
  syncDesktopPageDom()
  document.querySelectorAll('.desktop-widget').forEach(attachDesktopWidgetRemoveButton)
  switchDesktopPage(Math.min(currentPage, TOTAL_PAGES - 1), true)
}

function enterDesktopEditMode(startEl, pointerEvent) {
  if (!_desktopEditing) {
    activateDesktopEditModeInPlace()
  }
  if (startEl && pointerEvent) {
    var selector = '[data-id="' + startEl.dataset.id + '"][data-area="' + startEl.dataset.area + '"]'
    if (startEl.dataset.page != null) selector += '[data-page="' + startEl.dataset.page + '"]'
    var liveEl = document.querySelector(selector)
    if (liveEl) startDesktopDrag(liveEl, pointerEvent)
  }
}

async function exitDesktopEditMode() {
  _desktopEditing = false
  clearDesktopEdgeTimer()
  cleanDesktopPages()
  await saveDesktopLayout()
  renderDesktop()
}

function bindDesktopEditChrome() {
  var done = document.getElementById('desktop-edit-done')
  if (done) done.addEventListener('click', exitDesktopEditMode)
  var add = document.getElementById('desktop-add-widget')
  if (add) add.addEventListener('click', showWidgetsSheet)
}

function bindEditableIcon(el) {
  el.addEventListener('contextmenu', function(e) {
    e.preventDefault()
  })
  el.addEventListener('pointerdown', function(e) {
    if (e.button != null && e.button !== 0) return
    e.preventDefault()
    _desktopPointerDown = {
      el: el,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      timer: setTimeout(function() {
        enterDesktopEditMode(el, e)
      }, EDIT_LONG_PRESS_MS)
    }
  }, NON_PASSIVE_POINTER_OPTIONS)
  el.addEventListener('pointermove', function(e) {
    if (!_desktopPointerDown || _desktopPointerDown.el !== el) return
    if (e.pointerId !== _desktopPointerDown.pointerId) return
    if (_desktopEditing) e.preventDefault()
    var dx = Math.abs(e.clientX - _desktopPointerDown.startX)
    var dy = Math.abs(e.clientY - _desktopPointerDown.startY)
    if (!_desktopEditing && (dx > 8 || dy > 8)) clearDesktopPointerDown()
    if (_desktopEditing && !_desktopDrag && (dx > 3 || dy > 3)) startDesktopDrag(el, e)
  }, NON_PASSIVE_POINTER_OPTIONS)
  el.addEventListener('pointerup', function(e) {
    if (_desktopPointerDown && e.pointerId !== _desktopPointerDown.pointerId) return
    clearDesktopPointerDown()
  })
  el.addEventListener('pointercancel', function(e) {
    if (_desktopPointerDown && e.pointerId !== _desktopPointerDown.pointerId) return
    clearDesktopPointerDown()
  })
}

function clearDesktopPointerDown() {
  if (_desktopPointerDown && _desktopPointerDown.timer) clearTimeout(_desktopPointerDown.timer)
  _desktopPointerDown = null
}

function ensureDesktopWidgetDragLayer() {
  var layer = document.querySelector('.desktop-widget-drag-layer')
  if (!layer) {
    layer = document.createElement('div')
    layer.className = 'desktop-widget-drag-layer'
    document.body.appendChild(layer)
  }
  return layer
}

function startDesktopDrag(el, e) {
  if (_desktopDrag || !el) return
  clearDesktopPointerDown()
  var rect = el.getBoundingClientRect()
  var isWidgetDrag = el.classList.contains('desktop-widget')
  var widgetLayer = ensureDesktopWidgetDragLayer()
  var ghost = el.cloneNode(true)
  ghost.classList.add('desktop-drag-ghost')
  ghost.style.width = rect.width + 'px'
  ghost.style.height = rect.height + 'px'
  ghost.style.maxWidth = rect.width + 'px'
  ghost.style.maxHeight = rect.height + 'px'
  ghost.style.left = '0'
  ghost.style.top = '0'
  ghost.querySelectorAll('.desktop-widget-remove').forEach(function(btn) {
    btn.remove()
  })
  widgetLayer.appendChild(ghost)
  el.classList.add('is-dragging-source')
  el.dataset.suppressClick = '1'
  _desktopDrag = {
    id: el.dataset.id,
    pointerId: e.pointerId,
    source: {
      area: el.dataset.area,
      page: el.dataset.page == null ? -1 : parseInt(el.dataset.page, 10),
      index: el.dataset.slot == null ? getElementIndex(el) : parseInt(el.dataset.slot, 10)
    },
    el: el,
    ghost: ghost,
    isWidget: isWidgetDrag,
    widgetLayer: widgetLayer,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    moved: false,
    finishing: false
  }
  moveDesktopDragGhost(e.clientX, e.clientY)
  document.addEventListener('pointermove', onDesktopDragMove, DOCUMENT_DRAG_POINTER_OPTIONS)
  document.addEventListener('pointerup', onDesktopDragEnd, true)
  document.addEventListener('pointercancel', cancelDesktopDrag, true)
}

function moveDesktopDragGhost(x, y) {
  if (!_desktopDrag) return
  var left = x - _desktopDrag.offsetX
  var top = y - _desktopDrag.offsetY
  _desktopDrag.ghost.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)'
}

function onDesktopDragMove(e) {
  if (!_desktopDrag || _desktopDrag.finishing || e.pointerId !== _desktopDrag.pointerId) return
  e.preventDefault()
  _desktopDrag.moved = true
  moveDesktopDragGhost(e.clientX, e.clientY)
  handleDesktopDragEdge(e.clientX)
}

function onDesktopDragEnd(e) {
  if (!_desktopDrag || _desktopDrag.finishing || e.pointerId !== _desktopDrag.pointerId) return
  finishDesktopDrop(e.clientX, e.clientY)
}

function cancelDesktopDrag(e) {
  if (!_desktopDrag || _desktopDrag.finishing || e.pointerId !== _desktopDrag.pointerId) return
  cleanupDesktopDrag(_desktopDrag)
}

function getSlotIndexFromPoint(pageEl, x, y) {
  if (!pageEl) return 0
  var rect = pageEl.getBoundingClientRect()
  var style = window.getComputedStyle ? getComputedStyle(pageEl) : null
  var padLeft = style ? parseFloat(style.paddingLeft) || 0 : 20
  var padTop = style ? parseFloat(style.paddingTop) || 0 : 16
  var padRight = style ? parseFloat(style.paddingRight) || 0 : 20
  var padBottom = style ? parseFloat(style.paddingBottom) || 0 : 16
  var colGap = style ? parseFloat(style.columnGap) || 0 : 12
  var rowGap = style ? parseFloat(style.rowGap) || 0 : 20
  var gridWidth = Math.max(1, rect.width - padLeft - padRight)
  var gridHeight = Math.max(1, rect.height - padTop - padBottom)
  var cellWidth = (gridWidth - colGap * (DESKTOP_GRID_COLS - 1)) / DESKTOP_GRID_COLS
  var cellHeight = (gridHeight - rowGap * (_desktopGridRows - 1)) / _desktopGridRows
  var localX = Math.max(0, Math.min(gridWidth - 1, x - rect.left - padLeft))
  var localY = Math.max(0, Math.min(gridHeight - 1, y - rect.top - padTop))
  var col = Math.max(0, Math.min(DESKTOP_GRID_COLS - 1, Math.floor(localX / Math.max(1, cellWidth + colGap))))
  var row = Math.max(0, Math.min(_desktopGridRows - 1, Math.floor(localY / Math.max(1, cellHeight + rowGap))))
  return row * DESKTOP_GRID_COLS + col
}

function getDesktopDropTarget(x, y) {
  var dockArea = document.getElementById('dock-area')
  if (dockArea) {
    var dockRect = dockArea.getBoundingClientRect()
    if (x >= dockRect.left && x <= dockRect.right && y >= dockRect.top && y <= dockRect.bottom) {
      return { area: 'dock' }
    }
  }
  var viewport = document.getElementById('desktop-viewport')
  var viewportRect = viewport ? viewport.getBoundingClientRect() : null
  var pageIndex = currentPage
  var pageEl = document.getElementById('desktop-page-' + pageIndex)
  if (viewportRect && (x < viewportRect.left || x > viewportRect.right || y < viewportRect.top || y > viewportRect.bottom)) {
    var fallbackSlot = getSlotIndexFromPoint(pageEl, x, y)
    return {
      area: 'desktop',
      page: pageIndex,
      slot: fallbackSlot
    }
  }
  var slotIndex = getSlotIndexFromPoint(pageEl, x, y)
  if (pageEl) {
    return {
      area: 'desktop',
      page: pageIndex,
      slot: slotIndex
    }
  }
  return {
    area: 'desktop',
    page: pageIndex,
    slot: slotIndex
  }
}

function finishDesktopDrop(x, y) {
  var drag = _desktopDrag
  if (!drag || drag.finishing) return
  drag.finishing = true
  var target = getDesktopDropTarget(x, y)
  cleanupDesktopDrag(drag)
  if (target.area === 'dock') {
    moveIconToDock(drag.id, drag.source)
  } else {
    var pageIndex = target.page != null ? target.page : currentPage
    moveIconToDesktop(drag.id, pageIndex, target.slot)
  }
  if (_desktopEditing) ensureEditableTrailingPage()
  refreshDesktopAfterDrop(drag, target)
  saveDesktopLayout().catch(function(err) {
    console.error('[弯弯] 保存桌面布局失败:', err)
  })
}

function refreshDesktopAfterDrop(drag, target) {
  syncDesktopPageDom()
  var pages = {}
  if (drag.source && drag.source.area === 'desktop' && drag.source.page >= 0) pages[drag.source.page] = true
  if (target && target.area === 'desktop') pages[target.page != null ? target.page : currentPage] = true
  Object.keys(pages).forEach(function(pageIndex) {
    renderIcons(parseInt(pageIndex, 10))
  })
  if ((drag.source && drag.source.area === 'dock') || (target && target.area === 'dock')) renderDock()
  updateDesktopPageEmptyStates()
  switchDesktopPage(Math.min(currentPage, TOTAL_PAGES - 1), true)
}

function cleanupDesktopDrag(drag) {
  drag = drag || _desktopDrag
  clearDesktopEdgeTimer()
  if (drag) {
    if (drag.ghost) drag.ghost.remove()
    if (drag.widgetLayer && !drag.widgetLayer.children.length) {
      drag.widgetLayer.remove()
    }
    if (drag.el) {
      drag.el.classList.remove('is-dragging-source')
      setTimeout(function(el) {
        delete el.dataset.suppressClick
      }, 0, drag.el)
    }
  }
  if (_desktopDrag === drag) _desktopDrag = null
  document.removeEventListener('pointermove', onDesktopDragMove, true)
  document.removeEventListener('pointerup', onDesktopDragEnd, true)
  document.removeEventListener('pointercancel', cancelDesktopDrag, true)
}

function getElementIndex(el) {
  return Array.prototype.indexOf.call(el.parentNode.children, el)
}

function handleDesktopDragEdge(x) {
  var direction = 0
  if (x < 42 && currentPage > 0) direction = -1
  else if (x > window.innerWidth - 42 && currentPage < TOTAL_PAGES - 1) direction = 1
  if (!direction) {
    clearDesktopEdgeTimer()
    return
  }
  if (_desktopEdgeTimer && _desktopEdgeTimer.direction === direction) return
  clearDesktopEdgeTimer()
  _desktopEdgeTimer = setTimeout(function() {
    switchDesktopPage(currentPage + direction)
    clearDesktopEdgeTimer()
  }, DESKTOP_EDGE_SWITCH_MS)
  _desktopEdgeTimer.direction = direction
}

function clearDesktopEdgeTimer() {
  if (_desktopEdgeTimer) clearTimeout(_desktopEdgeTimer)
  _desktopEdgeTimer = null
}

function bindDesktopSwipe() {
  var wrapper = document.getElementById('desktop-wrapper')
  var homePage = document.getElementById('home-page')
  if (!wrapper || !homePage) return
  var startX = 0, startY = 0, isDragging = false, isHorizontal = null
  homePage.addEventListener('touchstart', function(e) {
    if (_desktopDrag || (_desktopEditing && e.target.closest('.app-icon, .dock-item, .desktop-widget'))) return
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    isDragging = true
    isHorizontal = null
  }, { passive: true })
  homePage.addEventListener('touchmove', function(e) {
    if (_desktopDrag) return
    if (!isDragging) return
    if (isHorizontal === null) {
      var dx = Math.abs(e.touches[0].clientX - startX)
      var dy = Math.abs(e.touches[0].clientY - startY)
      if (dx > 5 || dy > 5) isHorizontal = dx > dy
    }
  }, { passive: true })
  homePage.addEventListener('touchend', function(e) {
    if (_desktopDrag) return
    if (!isDragging) return
    isDragging = false
    if (isHorizontal === false) return
    var dx = e.changedTouches[0].clientX - startX
    if (Math.abs(dx) < 40) return
    if (dx < 0 && currentPage < TOTAL_PAGES - 1) switchDesktopPage(currentPage + 1)
    else if (dx > 0 && currentPage > 0) switchDesktopPage(currentPage - 1)
  }, { passive: true })
}

// ===== 切换桌面页 =====
function switchDesktopPage(n, immediate) {
  currentPage = Math.max(0, Math.min(n, TOTAL_PAGES - 1))
  var wrapper = document.getElementById('desktop-wrapper')
  var homePage = document.getElementById('home-page')
  if (wrapper) {
    clearTimeout(_desktopPageTransitionTimer)
    if (homePage) homePage.classList.toggle('desktop-page-switching', _desktopEditing && !immediate)
    if (immediate) wrapper.style.transition = 'none'
    wrapper.style.transform = 'translate3d(-' + (currentPage * 100) + '%, 0, 0)'
    if (immediate) {
      requestAnimationFrame(function() {
        wrapper.style.transition = ''
      })
    } else {
      _desktopPageTransitionTimer = setTimeout(function() {
        if (homePage && homePage.isConnected) homePage.classList.remove('desktop-page-switching')
      }, 340)
    }
  }
  document.querySelectorAll('.page-dots .dot').forEach(function(dot, i) {
    dot.classList.toggle('active', i === currentPage)
  })
}

// ===== 顶部问候组件 =====
async function renderTopWidget() {
  var cfg = await db.config.get('topWidgetText')
  var text = cfg ? cfg.value : '你好呀'
  var el = document.getElementById('widget-text')
  if (el) el.textContent = text
  var widget = document.getElementById('top-widget')
  if (widget) widget.addEventListener('click', toggleNotificationPanel)
}

// ===== 更新通知角标 =====
function updateBadge(count) {
  var badge = document.getElementById('widget-badge')
  if (!badge) return
  badge.style.display = count > 0 ? 'flex' : 'none'
  badge.textContent = count > 99 ? '99+' : count
}

// ===== 通知面板展开/收起 =====
function toggleNotificationPanel() {
  var panel = document.getElementById('notif-panel')
  if (panel) panel.classList.toggle('show')
}

// ===== 刷新桌面 =====
window.refreshDesktop = function() {
  renderTopWidget()
  updateDesktopGridMetrics()
  cleanDesktopPages()
  if (_desktopEditing) ensureEditableTrailingPage()
  renderDesktopPages()
  renderDock()
  for (var i = 0; i < TOTAL_PAGES; i++) renderIcons(i)
  bindPageDots()
  bindDesktopEditChrome()
  switchDesktopPage(currentPage, true)
}

// ===== iScreen 主界面 =====
window.showiScreenPage = async function() {
  await loadDesktopIconCustomizations()
  await loadDesktopWidgets()
  var page = document.createElement('div')
  page.id = 'iscreen-page'
  page.className = 'full-page iscreen-page'
  page.innerHTML =
    '<div class="page-header">' +
      '<button class="header-back" onclick="window.closePage(\'iscreen-page\')">' +
        '<i class="fa fa-angle-left"></i>' +
      '</button>' +
      '<span class="header-title">iScreens</span>' +
    '</div>' +
    '<div class="iscreen-scroll">' +
      '<div class="iscreen-transfer-actions">' +
        '<button class="iscreen-transfer-btn" id="iscreen-export-settings" type="button">' +
          '<i class="fa fa-download"></i><span>导出 iScreen</span>' +
        '</button>' +
        '<button class="iscreen-transfer-btn" id="iscreen-import-settings" type="button">' +
          '<i class="fa fa-upload"></i><span>导入 iScreen</span>' +
        '</button>' +
      '</div>' +
      '<button class="iscreen-entry-card" id="iscreen-icon-pack-card">' +
        '<div class="iscreen-entry-main">' +
          '<div class="iscreen-entry-title">Icon Pack</div>' +
          '<div class="iscreen-entry-sub">桌面图标设置</div>' +
        '</div>' +
        '<div class="iscreen-entry-preview" id="iscreen-entry-preview"></div>' +
        '<i class="fa fa-angle-right iscreen-entry-arrow"></i>' +
      '</button>' +
      '<button class="iscreen-entry-card" id="iscreen-widget-gallery-card">' +
        '<div class="iscreen-entry-main">' +
          '<div class="iscreen-entry-title">Widgets Gallery</div>' +
          '<div class="iscreen-entry-sub">组件定制</div>' +
        '</div>' +
        '<div class="iscreen-widget-preview" id="iscreen-widget-preview"></div>' +
        '<i class="fa fa-angle-right iscreen-entry-arrow"></i>' +
      '</button>' +
      '<button class="iscreen-entry-card" id="iscreen-app-theme-card">' +
        '<div class="iscreen-entry-main">' +
          '<div class="iscreen-entry-title">APP Theme</div>' +
          '<div class="iscreen-entry-sub">微信页面自定义 CSS</div>' +
        '</div>' +
        '<div class="iscreen-app-theme-preview" aria-hidden="true">' +
          '<span class="iscreen-theme-swatch iscreen-theme-swatch-a"></span>' +
          '<span class="iscreen-theme-swatch iscreen-theme-swatch-b"></span>' +
          '<span class="iscreen-theme-swatch iscreen-theme-swatch-c"></span>' +
          '<span class="iscreen-theme-swatch iscreen-theme-swatch-d"></span>' +
          '<span class="iscreen-theme-brush"><i class="fa-solid fa-paintbrush"></i></span>' +
        '</div>' +
        '<i class="fa fa-angle-right iscreen-entry-arrow"></i>' +
      '</button>' +
      '<input type="file" id="iscreen-import-input" accept=".json" style="display:none">' +
    '</div>'
  window.openPage(page)
  renderiScreenEntryPreview(page)
  renderWidgetGalleryEntryPreview(page)
  bindiScreenTransferActions(page)
  page.querySelector('#iscreen-icon-pack-card').addEventListener('click', showIconPackPage)
  page.querySelector('#iscreen-widget-gallery-card').addEventListener('click', showWidgetsGalleryPage)
  page.querySelector('#iscreen-app-theme-card').addEventListener('click', function() {
    if (window.showWechatAppThemePage) window.showWechatAppThemePage()
  })
}

function bindiScreenTransferActions(page) {
  var input = page.querySelector('#iscreen-import-input')
  page.querySelector('#iscreen-export-settings').addEventListener('click', exportiScreenSettings)
  page.querySelector('#iscreen-import-settings').addEventListener('click', function() {
    input.click()
  })
  input.addEventListener('change', function(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    importiScreenSettings(file)
    input.value = ''
  })
}

function cloneDesktopSettingValue(value) {
  if (value == null) return value
  return JSON.parse(JSON.stringify(value))
}

function getExportDesktopLayout() {
  var layout = cloneDesktopSettingValue(_desktopLayout || normalizeDesktopLayout(null, false))
  layout.gridRows = _desktopGridRows
  return layout
}

async function buildiScreenBackupData() {
  await loadDesktopIconCustomizations()
  await loadDesktopLabelColor()
  await loadDesktopWidgets()
  await loadDesktopLayout()
  var wallpaper = ''
  if (window.db) {
    var wallpaperCfg = await db.config.get(DESKTOP_WALLPAPER_KEY)
    wallpaper = wallpaperCfg && wallpaperCfg.value ? wallpaperCfg.value : ''
  }
  var wechatAppThemeCss = window.getWechatAppThemeCss
    ? await window.getWechatAppThemeCss()
    : ''
  return {
    version: 1,
    appName: '弯弯',
    type: ISCREEN_BACKUP_TYPE,
    exportedAt: Date.now(),
    desktop: {
      iconPack: {
        customizations: cloneDesktopSettingValue(_desktopIconCustomizations || {}),
        labelColor: _desktopLabelColor || ''
      },
      widgetsGallery: {
        widgets: cloneDesktopSettingValue(_desktopWidgets || []),
        layout: getExportDesktopLayout()
      },
      appTheme: {
        wechatCss: wechatAppThemeCss
      },
      wallpaperData: wallpaper
    }
  }
}

function downloadiScreenJSON(data) {
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  var a = document.createElement('a')
  var dateStr = new Date().toISOString().slice(0, 10)
  a.href = URL.createObjectURL(blob)
  a.download = 'wanwan-iscreen-' + dateStr + '.json'
  a.click()
  URL.revokeObjectURL(a.href)
}

async function exportiScreenSettings() {
  try {
    var data = await buildiScreenBackupData()
    downloadiScreenJSON(data)
    window.toast('iScreen 已导出')
  } catch (err) {
    window.toast('导出失败：' + err.message)
  }
}

function validateiScreenBackupData(data) {
  if (!data || data.version !== 1 || data.appName !== '弯弯' || data.type !== ISCREEN_BACKUP_TYPE || !data.desktop) {
    throw new Error('不支持的 iScreen 文件')
  }
  if (Object.prototype.hasOwnProperty.call(data.desktop, 'appTheme')) {
    var appTheme = data.desktop.appTheme
    if (!appTheme || (appTheme.wechatCss != null && typeof appTheme.wechatCss !== 'string')) {
      throw new Error('APP Theme 数据格式无效')
    }
    if (window.validateWechatAppThemeCss) {
      var validation = window.validateWechatAppThemeCss(appTheme.wechatCss || '')
      if (!validation.valid) throw new Error('APP Theme CSS 无效：' + validation.errors[0])
    }
  }
}

async function importiScreenSettings(file) {
  try {
    var text = await file.text()
    var data = JSON.parse(text)
    validateiScreenBackupData(data)
    await applyiScreenBackupData(data)
    window.toast('iScreen 已导入，即将刷新...')
    setTimeout(function() { location.reload() }, 1200)
  } catch (err) {
    window.toast('导入失败：' + err.message)
  }
}

async function applyiScreenBackupData(data) {
  var desktop = data.desktop || {}
  var iconPack = desktop.iconPack || {}
  var widgetsGallery = desktop.widgetsGallery || {}
  var appTheme = desktop.appTheme || {}

  _desktopIconCustomizations = iconPack.customizations && typeof iconPack.customizations === 'object'
    ? iconPack.customizations
    : {}
  _desktopLabelColor = normalizeDesktopLabelColor(iconPack.labelColor)
  _desktopWidgets = Array.isArray(widgetsGallery.widgets)
    ? widgetsGallery.widgets.filter(function(widget) {
      return widget && widget.id && widget.type === 'widget'
    }).map(function(widget) {
      return normalizeDesktopWidgetDefinition(widget)
    })
    : []
  if (widgetsGallery.layout && widgetsGallery.layout.gridRows) {
    _desktopGridRows = widgetsGallery.layout.gridRows
    _desktopSlotsPerPage = DESKTOP_GRID_COLS * _desktopGridRows
  }
  _desktopLayout = normalizeDesktopLayout(widgetsGallery.layout || null, false)

  await saveDesktopIconCustomizations()
  await saveDesktopLabelColor()
  await saveDesktopWidgets()
  await saveDesktopLayout()

  if (Object.prototype.hasOwnProperty.call(desktop, 'appTheme') && window.saveWechatAppThemeCss) {
    await window.saveWechatAppThemeCss(typeof appTheme.wechatCss === 'string' ? appTheme.wechatCss : '')
  }

  if (desktop.wallpaperData) {
    await db.config.put({ key: DESKTOP_WALLPAPER_KEY, value: desktop.wallpaperData })
    window.setWallpaper(desktop.wallpaperData)
  } else {
    await db.config.delete(DESKTOP_WALLPAPER_KEY)
    window.setWallpaper(null)
  }
}

async function showIconPackPage() {
  await loadDesktopIconCustomizations()
  await loadDesktopLabelColor()
  var page = document.createElement('div')
  page.id = 'icon-pack-page'
  page.className = 'full-page iscreen-page icon-pack-page'
  page.innerHTML =
    '<div class="page-header">' +
      '<button class="header-back" onclick="window.closePage(\'icon-pack-page\')">' +
        '<i class="fa fa-angle-left"></i>' +
      '</button>' +
      '<span class="header-title">Icon Pack</span>' +
    '</div>' +
    '<div class="iscreen-scroll">' +
      '<section class="iscreen-label-color-card">' +
        '<div class="iscreen-label-color-main">' +
          '<div class="iscreen-row-label">文字颜色</div>' +
          '<div class="iscreen-row-sub">统一设置主屏幕所有软件名称</div>' +
          '<button class="iscreen-action" id="iscreen-label-color-reset" type="button">恢复默认</button>' +
        '</div>' +
        '<label class="iscreen-color-control" title="文字颜色" aria-label="文字颜色">' +
          '<span class="iscreen-color-swatch" id="iscreen-label-color-swatch"></span>' +
          '<input type="color" id="iscreen-label-color-input">' +
        '</label>' +
      '</section>' +
      '<div class="iscreen-pack-toolbar">' +
        '<div class="iscreen-pack-subtitle">桌面图标设置</div>' +
        '<button class="iscreen-reset-all" id="iscreen-reset-all">全部恢复</button>' +
      '</div>' +
      '<section class="iscreen-list" id="iscreen-icon-list"></section>' +
    '</div>'
  window.openPage(page)
  bindDesktopLabelColorControl(page)
  renderiScreenControls(page)
}

function bindDesktopLabelColorControl(page) {
  var input = page.querySelector('#iscreen-label-color-input')
  var swatch = page.querySelector('#iscreen-label-color-swatch')
  var reset = page.querySelector('#iscreen-label-color-reset')

  function renderControl() {
    var color = getDesktopLabelPickerColor()
    input.value = color
    swatch.style.background = color
    reset.disabled = !_desktopLabelColor
  }

  input.addEventListener('input', async function(e) {
    _desktopLabelColor = normalizeDesktopLabelColor(e.target.value)
    await saveDesktopLabelColor()
    applyDesktopLabelColor()
    renderControl()
  })

  reset.addEventListener('click', async function() {
    _desktopLabelColor = ''
    await saveDesktopLabelColor()
    applyDesktopLabelColor()
    renderControl()
    window.toast('文字颜色已恢复默认')
  })

  renderControl()
}

function renderiScreenControls(page) {
  var list = page.querySelector('#iscreen-icon-list')
  var icons = getAllDesktopIcons()
  list.innerHTML = icons.map(function(item) {
    var custom = getDesktopIconCustom(item.id)
    var color = custom.color || DEFAULT_DESKTOP_ICON_COLOR
    var imageLabel = custom.image ? '已替换图片' : '使用原图标'
    return '' +
      '<div class="iscreen-row" data-icon-id="' + escapeMainHtml(item.id) + '">' +
        '<div class="iscreen-row-icon">' +
          '<div class="icon-bg"' + buildDesktopIconStyle(custom) + '>' + buildDesktopIconInner(item, custom) + '</div>' +
        '</div>' +
        '<div class="iscreen-row-main">' +
          '<div class="iscreen-row-label">' + escapeMainHtml(item.label) + '</div>' +
          '<div class="iscreen-row-sub">' + imageLabel + '</div>' +
          '<div class="iscreen-row-actions">' +
            '<button class="iscreen-action" data-action="replace">替换图标</button>' +
            '<button class="iscreen-action" data-action="restore-image">恢复图标</button>' +
          '</div>' +
        '</div>' +
        '<label class="iscreen-color-control" title="图标颜色" aria-label="图标颜色">' +
          '<span class="iscreen-color-swatch" style="background:' + escapeMainHtml(color) + '"></span>' +
          '<input type="color" value="' + escapeMainHtml(color) + '" data-action="color">' +
        '</label>' +
      '</div>'
  }).join('')

  list.querySelectorAll('.iscreen-row').forEach(function(row) {
    var iconId = row.dataset.iconId
    row.querySelector('[data-action="replace"]').addEventListener('click', function() {
      window.showImagePicker(async function(imageUrl) {
        var custom = Object.assign({}, getDesktopIconCustom(iconId), { image: imageUrl })
        _desktopIconCustomizations[iconId] = custom
        await saveDesktopIconCustomizations()
        window.refreshDesktop()
        renderiScreenControls(page)
        window.toast('图标已替换')
      })
    })
    row.querySelector('[data-action="restore-image"]').addEventListener('click', async function() {
      var custom = Object.assign({}, getDesktopIconCustom(iconId))
      delete custom.image
      if (custom.color) _desktopIconCustomizations[iconId] = custom
      else delete _desktopIconCustomizations[iconId]
      await saveDesktopIconCustomizations()
      window.refreshDesktop()
      renderiScreenControls(page)
      window.toast('已恢复原图标')
    })
    row.querySelector('[data-action="color"]').addEventListener('input', async function(e) {
      var custom = Object.assign({}, getDesktopIconCustom(iconId), { color: e.target.value })
      _desktopIconCustomizations[iconId] = custom
      await saveDesktopIconCustomizations()
      window.refreshDesktop()
      row.querySelectorAll('.icon-bg').forEach(function(iconEl) {
        iconEl.style.setProperty('--icon-color', e.target.value)
      })
      var swatch = row.querySelector('.iscreen-color-swatch')
      if (swatch) swatch.style.background = e.target.value
    })
  })

  page.querySelector('#iscreen-reset-all').onclick = async function() {
    _desktopIconCustomizations = {}
    _desktopLabelColor = ''
    await db.config.delete(DESKTOP_ICON_CUSTOM_KEY)
    await saveDesktopLabelColor()
    applyDesktopLabelColor()
    window.refreshDesktop()
    var labelColor = getDesktopLabelPickerColor()
    page.querySelector('#iscreen-label-color-input').value = labelColor
    page.querySelector('#iscreen-label-color-swatch').style.background = labelColor
    page.querySelector('#iscreen-label-color-reset').disabled = true
    renderiScreenControls(page)
    window.toast('已恢复默认图标和文字颜色')
  }
}

function renderiScreenEntryPreview(page) {
  var preview = page.querySelector('#iscreen-entry-preview')
  if (!preview) return
  preview.innerHTML = getAllDesktopIcons().slice(0, 4).map(function(item) {
    var custom = getDesktopIconCustom(item.id)
    return '<div class="icon-bg"' + buildDesktopIconStyle(custom) + '>' + buildDesktopIconInner(item, custom) + '</div>'
  }).join('')
}

function renderWidgetGalleryEntryPreview(page) {
  var preview = page.querySelector('#iscreen-widget-preview')
  if (!preview) return
  preview.innerHTML =
    '<div class="widget-preview-wide"></div>' +
    '<div class="widget-preview-square"></div>' +
    '<div class="widget-preview-square widget-preview-muted"></div>'
}

async function showWidgetsGalleryPage() {
  await loadDesktopWidgets()
  var page = document.createElement('div')
  page.id = 'widgets-gallery-page'
  page.className = 'full-page iscreen-page widgets-gallery-page'
  page.innerHTML =
    '<div class="page-header">' +
      '<button class="header-back" onclick="window.closePage(\'widgets-gallery-page\')">' +
        '<i class="fa fa-angle-left"></i>' +
      '</button>' +
      '<span class="header-title">Widgets Gallery</span>' +
    '</div>' +
    '<div class="iscreen-scroll">' +
      '<div class="iscreen-pack-toolbar">' +
        '<div class="iscreen-pack-subtitle">组件定制</div>' +
      '</div>' +
      '<section class="widget-gallery-section" id="widget-gallery-custom-html"></section>' +
      '<section class="widget-gallery-section" id="widget-gallery-defaults"></section>' +
    '</div>'
  window.openPage(page)
  await loadCustomWidgetTemplates()
  renderCustomHtmlWidgetList(page)
  renderWidgetsGallery(page, false)
}

function buildCustomTemplatePreviewWidget(tpl) {
  return {
    id: 'widget-tpl-preview-' + tpl.id,
    type: 'widget',
    templateId: 'custom-html',
    cols: tpl.cols,
    rows: tpl.rows,
    className: 'custom-html-widget',
    data: { html: tpl.html, values: {} }
  }
}

function renderCustomHtmlWidgetList(page) {
  var section = page.querySelector('#widget-gallery-custom-html')
  if (!section) return
  var listHtml
  if (!_customWidgetTemplates.length) {
    listHtml = '<div class="custom-html-list-empty">暂无自定义组件，在下方粘贴 HTML 创建，或导入组件文件。</div>'
  } else {
    listHtml = _customWidgetTemplates.map(function(tpl) {
      var size = tpl.cols + 'x' + tpl.rows
      // 预览按桌面真实比例（约 84px/格）渲染后整体缩放，避免内容被截断
      var realW = (tpl.cols || 4) * 84
      var realH = (tpl.rows || 1) * 84
      var scale = Math.min(96 / realW, 64 / realH)
      var previewStyle = 'width:' + realW + 'px;height:' + realH + 'px;transform:scale(' + scale.toFixed(3) + ');'
      var previewBoxStyle = 'width:' + Math.round(realW * scale) + 'px;height:' + Math.round(realH * scale) + 'px;'
      return '<div class="custom-html-list-item" data-template-id="' + escapeMainHtml(tpl.id) + '">' +
        '<div class="custom-html-list-preview" style="' + previewBoxStyle + '"><div class="desktop-widget custom-html-widget" style="' + previewStyle + '">' + buildDesktopWidgetInner(buildCustomTemplatePreviewWidget(tpl)) + '</div></div>' +
        '<div class="custom-html-list-meta">' +
          '<div class="custom-html-list-title">' + escapeMainHtml(tpl.name || '自定义组件') + '</div>' +
          '<div class="custom-html-list-sub">' + escapeMainHtml(size) + '</div>' +
        '</div>' +
        '<div class="custom-html-list-actions">' +
          '<div class="custom-html-list-btns">' +
            '<button class="iscreen-action custom-html-edit-btn" type="button">编辑</button>' +
            '<button class="iscreen-action custom-html-export-btn" type="button">导出</button>' +
          '</div>' +
          '<button class="custom-html-delete-btn" type="button" aria-label="删除组件">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>'
    }).join('')
  }
  section.innerHTML =
    '<div class="widget-gallery-heading">我的组件</div>' +
    '<div class="widget-custom-html-tip">创建的组件会出现在桌面编辑模式的「添加组件」弹窗中。可修改的头像用 <code>{avatar:名称}</code>、文字用 <code>{text:名称}</code> 标记。</div>' +
    '<div class="custom-html-list">' + listHtml + '</div>' +
    '<div class="widget-custom-form widget-custom-html-form">' +
      '<label>名称<input id="custom-tpl-name" placeholder="自定义组件"></label>' +
      '<label>尺寸<select id="custom-tpl-size"><option value="4x1">4x1</option><option value="4x2">4x2</option><option value="2x2">2x2</option><option value="4x3">4x3</option></select></label>' +
      '<textarea id="custom-tpl-html" class="widget-custom-html-input" placeholder="在此粘贴组件 HTML…"></textarea>' +
      '<div class="custom-html-form-actions">' +
        '<button class="iscreen-action" id="custom-tpl-import" type="button"><i class="fa fa-upload"></i> 导入组件</button>' +
        '<button class="iscreen-action widget-add-custom" id="custom-tpl-add" type="button">添加自定义组件</button>' +
      '</div>' +
      '<input type="file" id="custom-tpl-import-input" accept=".json" style="display:none">' +
    '</div>'
  section.querySelectorAll('.custom-html-edit-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var templateId = btn.closest('.custom-html-list-item').dataset.templateId
      openCustomHtmlSourceEditor(templateId, function() { renderCustomHtmlWidgetList(page) })
    })
  })
  section.querySelectorAll('.custom-html-export-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var templateId = btn.closest('.custom-html-list-item').dataset.templateId
      exportCustomWidgetTemplate(templateId)
    })
  })
  section.querySelectorAll('.custom-html-delete-btn').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      var templateId = btn.closest('.custom-html-list-item').dataset.templateId
      var tpl = _customWidgetTemplates.find(function(item) { return item.id === templateId })
      if (!tpl) return
      if (!confirm('删除组件「' + (tpl.name || '自定义组件') + '」？桌面上已添加的不受影响。')) return
      _customWidgetTemplates = _customWidgetTemplates.filter(function(item) { return item.id !== templateId })
      await saveCustomWidgetTemplates()
      renderCustomHtmlWidgetList(page)
      window.toast('已删除')
    })
  })
  section.querySelector('#custom-tpl-add').addEventListener('click', async function() {
    var html = section.querySelector('#custom-tpl-html').value.trim()
    if (!html) {
      window.toast('请先粘贴组件 HTML')
      return
    }
    var size = section.querySelector('#custom-tpl-size').value.split('x')
    _customWidgetTemplates.push({
      id: 'cwt-' + Date.now(),
      name: section.querySelector('#custom-tpl-name').value.trim() || '自定义组件',
      cols: parseInt(size[0], 10) || 4,
      rows: parseInt(size[1], 10) || 1,
      html: html
    })
    await saveCustomWidgetTemplates()
    renderCustomHtmlWidgetList(page)
    window.toast('已创建，可在桌面「添加组件」中使用')
  })
  var importInput = section.querySelector('#custom-tpl-import-input')
  section.querySelector('#custom-tpl-import').addEventListener('click', function() {
    importInput.click()
  })
  importInput.addEventListener('change', function(e) {
    var file = e.target.files && e.target.files[0]
    if (!file) return
    importCustomWidgetTemplate(file, function() { renderCustomHtmlWidgetList(page) })
    importInput.value = ''
  })
}

function exportCustomWidgetTemplate(templateId) {
  var tpl = _customWidgetTemplates.find(function(item) { return item.id === templateId })
  if (!tpl) return
  var data = {
    type: 'wanwan-custom-widget',
    version: 1,
    widget: { name: tpl.name || '自定义组件', cols: tpl.cols, rows: tpl.rows, html: tpl.html }
  }
  var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  var a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'wanwanwidget-' + (tpl.name || '自定义组件') + '.json'
  a.click()
  URL.revokeObjectURL(a.href)
  window.toast('组件已导出')
}

function importCustomWidgetTemplate(file, onDone) {
  var reader = new FileReader()
  reader.onload = async function() {
    try {
      var data = JSON.parse(reader.result)
      if (!data || data.type !== 'wanwan-custom-widget' || !data.widget || typeof data.widget.html !== 'string' || !data.widget.html) {
        throw new Error('不支持的组件文件')
      }
      _customWidgetTemplates.push({
        id: 'cwt-' + Date.now(),
        name: String(data.widget.name || '自定义组件'),
        cols: parseInt(data.widget.cols, 10) || 4,
        rows: parseInt(data.widget.rows, 10) || 1,
        html: data.widget.html
      })
      await saveCustomWidgetTemplates()
      if (typeof onDone === 'function') onDone()
      window.toast('组件已导入')
    } catch (err) {
      window.toast('导入失败：' + (err && err.message ? err.message : '文件无效'))
    }
  }
  reader.readAsText(file)
}

function openCustomHtmlSourceEditor(templateId, onSaved) {
  var tpl = _customWidgetTemplates.find(function(item) { return item.id === templateId })
  if (!tpl) return
  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay'
  overlay.style.zIndex = '240'
  var modal = document.createElement('div')
  modal.className = 'center-modal angel-editor-modal custom-html-source-modal'
  modal.style.zIndex = '241'
  modal.innerHTML =
    '<div class="angel-editor-heading">编辑 HTML 源码</div>' +
    '<div class="angel-editor-form">' +
      '<div class="widget-custom-html-tip">头像用 <code>{avatar:名称}</code>、文字用 <code>{text:名称}</code> 标记，名称相同的占位符会保留已填内容。</div>' +
      '<textarea class="widget-custom-html-input custom-html-source-input" id="custom-html-source-input"></textarea>' +
      '<div class="angel-editor-actions">' +
        '<button class="btn-pill" id="custom-html-source-cancel" type="button">取消</button>' +
        '<button class="btn-pill angel-editor-save" id="custom-html-source-save" type="button">保存</button>' +
      '</div>' +
    '</div>'
  document.body.appendChild(overlay)
  document.body.appendChild(modal)
  modal.querySelector('#custom-html-source-input').value = tpl.html || ''
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    modal.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    modal.classList.remove('show')
    setTimeout(function() { overlay.remove(); modal.remove() }, 220)
  }
  overlay.addEventListener('click', close)
  modal.querySelector('#custom-html-source-cancel').addEventListener('click', close)
  modal.querySelector('#custom-html-source-save').addEventListener('click', async function() {
    var html = modal.querySelector('#custom-html-source-input').value.trim()
    if (!html) {
      window.toast('HTML 不能为空')
      return
    }
    tpl.html = html
    await saveCustomWidgetTemplates()
    // 同步更新桌面上由该模板添加的实例，已填内容按占位符名称保留
    var slots = parseCustomHtmlSlots(html)
    var instancesChanged = false
    _desktopWidgets.forEach(function(widget) {
      if (widget.templateId !== 'custom-html' || !widget.data || widget.data.customTemplateId !== tpl.id) return
      var oldValues = widget.data.values || {}
      var values = {}
      slots.forEach(function(slot) {
        if (oldValues[slot.name] !== undefined) values[slot.name] = oldValues[slot.name]
      })
      widget.data = Object.assign({}, widget.data, { html: html, values: values })
      instancesChanged = true
      var liveWidget = document.querySelector('.desktop-widget[data-id="' + widget.id + '"]')
      if (liveWidget) liveWidget.innerHTML = buildDesktopWidgetInner(widget)
    })
    if (instancesChanged) await saveDesktopWidgets()
    if (typeof onSaved === 'function') onSaved()
    window.toast('已保存')
    close()
  })
}

async function showWidgetsSheet() {
  await loadDesktopWidgets()
  await loadCustomWidgetTemplates()
  var old = document.querySelector('.widgets-sheet-overlay')
  if (old) old.remove()
  var oldSheet = document.querySelector('.widgets-sheet')
  if (oldSheet) oldSheet.remove()

  var overlay = document.createElement('div')
  overlay.className = 'sheet-overlay widgets-sheet-overlay'
  var sheet = document.createElement('div')
  sheet.className = 'modal-sheet widgets-sheet'
  sheet.innerHTML =
    '<div class="sheet-handle"></div>' +
    '<div class="widgets-sheet-header">添加组件</div>' +
    '<div class="widgets-sheet-body">' +
      '<section class="widget-gallery-section" id="widget-gallery-defaults"></section>' +
      '<section class="widget-gallery-section" id="widget-gallery-custom-templates"></section>' +
    '</div>'
  // 挂 body 而非 #app：添加组件触发 refreshDesktop 会清空 #app，弹窗需存活
  document.body.appendChild(overlay)
  document.body.appendChild(sheet)
  requestAnimationFrame(function() {
    overlay.classList.add('show')
    sheet.classList.add('show')
  })
  var close = function() {
    overlay.classList.remove('show')
    sheet.classList.remove('show')
    setTimeout(function() { overlay.remove(); sheet.remove() }, 300)
  }
  overlay.addEventListener('click', close)
  renderWidgetsGallery(sheet, true)
}

function renderWidgetsGallery(container, interactive) {
  var grouped = {}
  DESKTOP_WIDGET_TEMPLATES.forEach(function(template) {
    var key = template.cols + 'x' + template.rows
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(template)
  })
  var cardClass = interactive ? 'widget-gallery-card' : 'widget-gallery-card is-static'
  var defaults = container.querySelector('#widget-gallery-defaults')
  defaults.innerHTML = Object.keys(grouped).map(function(size) {
    return '<div class="widget-gallery-heading">' + escapeMainHtml(size) + '</div>' +
      '<div class="widget-gallery-grid">' + grouped[size].map(function(template) {
        var widget = createDesktopWidgetFromTemplate(template)
        var subtitle = template.cols + 'x' + template.rows
        return '<button class="' + cardClass + '" data-template-id="' + escapeMainHtml(template.id) + '">' +
          '<div class="widget-gallery-preview preview-' + escapeMainHtml(size) + '"><div class="desktop-widget ' + escapeMainHtml(template.className) + '">' + buildDesktopWidgetInner(widget) + '</div></div>' +
          '<div class="widget-gallery-title">' + escapeMainHtml(template.title) + '</div>' +
          '<div class="widget-gallery-sub">' + escapeMainHtml(subtitle) + '</div>' +
        '</button>'
      }).join('') + '</div>'
  }).join('')

  if (!interactive) return

  defaults.querySelectorAll('[data-template-id]').forEach(function(btn) {
    btn.addEventListener('click', async function() {
      await addDesktopWidget(btn.dataset.templateId)
      window.toast('组件已添加')
    })
  })

  var customSection = container.querySelector('#widget-gallery-custom-templates')
  if (customSection) {
    var customCardsHtml
    if (!_customWidgetTemplates.length) {
      customCardsHtml = '<div class="custom-html-list-empty">暂无自定义组件，可在「iScreens → Widgets Gallery」中创建。</div>'
    } else {
      customCardsHtml = '<div class="widget-gallery-grid">' + _customWidgetTemplates.map(function(tpl) {
        var previewWidget = buildCustomTemplatePreviewWidget(tpl)
        return '<button class="widget-gallery-card" data-custom-template-id="' + escapeMainHtml(tpl.id) + '">' +
          '<div class="widget-gallery-preview preview-' + escapeMainHtml(tpl.cols + 'x' + tpl.rows) + '"><div class="desktop-widget custom-html-widget">' + buildDesktopWidgetInner(previewWidget) + '</div></div>' +
          '<div class="widget-gallery-title">' + escapeMainHtml(tpl.name || '自定义组件') + '</div>' +
          '<div class="widget-gallery-sub">' + escapeMainHtml(tpl.cols + 'x' + tpl.rows) + '</div>' +
        '</button>'
      }).join('') + '</div>'
    }
    customSection.innerHTML = '<div class="widget-gallery-heading">自定义组件</div>' + customCardsHtml
    customSection.querySelectorAll('[data-custom-template-id]').forEach(function(btn) {
      btn.addEventListener('click', async function() {
        var tpl = _customWidgetTemplates.find(function(item) { return item.id === btn.dataset.customTemplateId })
        if (!tpl) return
        var widget = {
          id: 'widget-html-' + Date.now(),
          type: 'widget',
          templateId: 'custom-html',
          title: tpl.name || '自定义组件',
          cols: tpl.cols,
          rows: tpl.rows,
          className: 'custom-html-widget',
          data: {
            html: tpl.html,
            values: {},
            customTemplateId: tpl.id
          }
        }
        _desktopWidgets.push(widget)
        placeWidgetInFirstEmptySlot(widget, currentPage)
        await saveDesktopWidgets()
        await saveDesktopLayout()
        window.refreshDesktop()
        window.toast('组件已添加')
      })
    })
  }
}

function createDesktopWidgetFromTemplate(template) {
  return {
    id: 'widget-preview-' + template.id,
    type: 'widget',
    templateId: template.id,
    title: template.title,
    cols: template.cols,
    rows: template.rows,
    className: template.className,
    data: Object.assign({}, template.data || {})
  }
}

async function addDesktopWidget(templateId) {
  var template = getDesktopWidgetTemplate(templateId)
  if (!template) return
  var widget = createDesktopWidgetFromTemplate(template)
  widget.id = 'widget-' + template.id + '-' + Date.now()
  widget = normalizeDesktopWidgetDefinition(widget)
  _desktopWidgets.push(widget)
  placeWidgetInFirstEmptySlot(widget, currentPage)
  await saveDesktopWidgets()
  await saveDesktopLayout()
  window.refreshDesktop()
}

// ===== 设置壁纸 =====
window.setWallpaper = function(imageUrl) {
  _homeWallpaperData = imageUrl || ''
  var home = document.getElementById('home-page')
  if (!home) return
  if (imageUrl) {
    home.style.backgroundImage = 'url(' + imageUrl + ')'
    home.classList.add('has-wallpaper')
  } else {
    home.style.backgroundImage = ''
    home.classList.remove('has-wallpaper')
  }
}
