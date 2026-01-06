# [1.1.0-rc.22](https://github.com/janovix/aml/compare/v1.1.0-rc.21...v1.1.0-rc.22) (2026-01-06)


### Bug Fixes

* fixed uma dashboard view, fixed fetch issues in CreateReportView ([e45faae](https://github.com/janovix/aml/commit/e45faae4595dcb846cc2d09e6b909bbe7aa685bf))


### Features

* add Notices management functionality with CRUD operations and UI components ([f422102](https://github.com/janovix/aml/commit/f4221025b623e3f8d1170a64c0c391220f236eab))
* enhance NavBreadcrumb and ReportsTable components to support report entity handling and improve navigation links ([247fba5](https://github.com/janovix/aml/commit/247fba53d3426824132ee216ff66f03c8cc500dc))

# [1.1.0-rc.21](https://github.com/janovix/aml/compare/v1.1.0-rc.20...v1.1.0-rc.21) (2026-01-04)


### Bug Fixes

* adjust layout of Navbar and NavBreadcrumb components for improved responsiveness and visual consistency ([2ec5844](https://github.com/janovix/aml/commit/2ec5844c9043282122ecb2ce3f69f108471d8a7e))
* improve DataTable component layout for loading and empty states, ensuring consistent row heights and placeholder rows ([053ee16](https://github.com/janovix/aml/commit/053ee16fee914c44e9edef8f0055b3d2c141e28e))


### Features

* add Caddyfile for local development setup and create LOCAL_DEV_SETUP.md for guidance on using deployed auth service ([8000aae](https://github.com/janovix/aml/commit/8000aaec3e90e98d872024b46a741776c55d3fc5))
* enhance ClientSelector to fetch client by ID when not found in search results, improving selection accuracy and user experience ([6832122](https://github.com/janovix/aml/commit/683212251c467f10db397ba4bba2cdc71bcd7ae2))
* enhance multilingual support, improving accessibility ([0f72161](https://github.com/janovix/aml/commit/0f7216121b844cc5ac6d578c8d4a9d7b3d41b06e))
* implement LanguageProvider and LanguageSwitcher components for multilingual support, enhancing user experience with language selection and translations ([cca4223](https://github.com/janovix/aml/commit/cca4223f95b956442f69370dec0ba631954a1a63))
* implement XML download functionality in AlertDetailsView and AlertsTable components ([d59a140](https://github.com/janovix/aml/commit/d59a140754b3c00fac182cbb75954179cec4f3e9))
* transition mobile drawer to dialog for CatalogSelector, ClientSelector, and AlertRuleSelector components, enhancing mobile user experience with close button functionality ([4cfff22](https://github.com/janovix/aml/commit/4cfff22332938807d469a77f010f2c525cc8f020))

# [1.1.0-rc.20](https://github.com/janovix/aml/compare/v1.1.0-rc.19...v1.1.0-rc.20) (2026-01-03)


### Features

* add AlertDetailsView component and related navigation enhancements for detailed alert management ([590ac48](https://github.com/janovix/aml/commit/590ac4850def3900f02e611c747141b17d5911ab))
* add CreateManualAlertView and AlertRuleSelector components with corresponding tests for manual alert creation functionality ([f490c39](https://github.com/janovix/aml/commit/f490c3964a226ce8eb4bdeb4c472a4ed1358044c))
* implement fetchCatalogItemById function with caching and error handling, and enhance CatalogSelector tests for item fetching scenarios ([961b876](https://github.com/janovix/aml/commit/961b87697bc8ca9e38d6b607b869cfafb4c5001c))

# [1.1.0-rc.19](https://github.com/janovix/aml/compare/v1.1.0-rc.18...v1.1.0-rc.19) (2025-12-31)


### Features

* add global 404 Not Found page with user-friendly navigation options ([b124c9a](https://github.com/janovix/aml/commit/b124c9a07a617f323c356776bf761f1d7b40da15))
* add unit tests for NotFound component and enhance empty state handling in DataTable and various tables with action options ([35c47b2](https://github.com/janovix/aml/commit/35c47b2cd2ddabfa34e15065bcc5a15d130ac71d))
* enhance empty state presentation in DataTable with improved layout and action options ([fe639d6](https://github.com/janovix/aml/commit/fe639d6cd9c56abf183cb40e4847c449f5731876))
* enhance UI components with PageHero for consistent navigation and loading states across various views ([92d03af](https://github.com/janovix/aml/commit/92d03aff03a27d5d1a42aa9163d0d10727be82d6))
* implement mobile drawer behavior for CatalogSelector and ClientSelector components with corresponding unit tests ([29fe121](https://github.com/janovix/aml/commit/29fe12196c9d47d7f651883e89acece6d96deb9d))
* implement organization URL utilities for enhanced routing and URL generation across components ([db99b15](https://github.com/janovix/aml/commit/db99b15f0ca3665210f2e4627f2a20aca5b4c4e5))
* implement organization-aware routing and navigation utilities for improved URL handling across components ([1d28264](https://github.com/janovix/aml/commit/1d282648eef7f6f00fd10102aac12b83b448b887))
* implement ScrollRestoration component for improved navigation experience and add unit tests for its functionality ([12d9ab4](https://github.com/janovix/aml/commit/12d9ab44531c340c7aeaef97c3426ac19409f2a2))
* optimize organization fetching and redirection logic to prevent duplicate requests and improve user experience ([3f8709a](https://github.com/janovix/aml/commit/3f8709a0df438f95336c1f722d71f655af0efead))
* update README and enhance organization switcher UI with improved logo handling and loading states ([49c5226](https://github.com/janovix/aml/commit/49c52267782ddda7c1899c2f0878e6c206b43db8))

# [1.1.0-rc.18](https://github.com/janovix/aml/compare/v1.1.0-rc.17...v1.1.0-rc.18) (2025-12-31)


### Features

* enhance Team and Settings pages with consistent page header components and improved layout ([edc7dc2](https://github.com/janovix/aml/commit/edc7dc2b2c23f3aaca9f42f23f67442d0f2a6770))
* implement AppSkeleton component in OrgBootstrapper for improved loading state visualization ([5618647](https://github.com/janovix/aml/commit/561864750e140de94849bfd7791ee9b3a2c07b07))
* synchronize auth session with selected organization in OrgBootstrapper and handle organization accessibility checks ([0758f21](https://github.com/janovix/aml/commit/0758f21062c9a27cb6cb6c125faf6467c9278906))

# [1.1.0-rc.17](https://github.com/janovix/aml/compare/v1.1.0-rc.16...v1.1.0-rc.17) (2025-12-31)


### Features

* add AddCatalogItemDialog component and integrate with CatalogSelector ([a5309e6](https://github.com/janovix/aml/commit/a5309e65cf472b14f3e7d965fc9e59f8f824a511))
* add Alertas and Reportes pages with corresponding tests and integrate infinite scroll functionality in tables ([73ef335](https://github.com/janovix/aml/commit/73ef335123e9260fdd14ca4287fa45ba7d92759d))
* add organization invitation acceptance page and integrate zustand for state management ([d47c343](https://github.com/janovix/aml/commit/d47c3437958139e6aaf8e9d3e3b1715653139de5))
* enhance organization handling in AlertsTable, ClientsTable, and TransactionsTable components to prevent API calls when no organization is selected ([c5682ff](https://github.com/janovix/aml/commit/c5682ffef6875b6bcde206b44bdca61496d80e65))
* implement organization change handling in AlertsTable, ClientsTable, and TransactionsTable components to refetch data on organization switch ([34ab3a3](https://github.com/janovix/aml/commit/34ab3a35d3bfb52bb915eb016c54b8b9a457dd0e))
* implement TeamPage and OrgTeamTable components with associated tests ([7632636](https://github.com/janovix/aml/commit/7632636981be3bc6cf1ce8b0f954c76d8d373868))
* update useJwt hook to refetch JWT token on organization change, ensuring the token includes organizationId claim ([26b6bec](https://github.com/janovix/aml/commit/26b6bec35f88a0d480990128d5ad76f8ea90ba7d))

# [1.1.0-rc.16](https://github.com/janovix/aml/compare/v1.1.0-rc.15...v1.1.0-rc.16) (2025-12-30)


### Features

* Set default country to Mexico for phone input ([faeb2a2](https://github.com/janovix/aml/commit/faeb2a217fb4447eacd8a20b873201cc04bde12a))

# [1.1.0-rc.15](https://github.com/janovix/aml/compare/v1.1.0-rc.14...v1.1.0-rc.15) (2025-12-30)


### Features

* integrate phone number input component across client forms and update package dependencies ([7ab7f84](https://github.com/janovix/aml/commit/7ab7f849214f59095c3a5799828093591b2b3215))
* introduce PageHero component for enhanced page headers and statistics display across various pages ([f48dd06](https://github.com/janovix/aml/commit/f48dd065dedb6862c66a09cc9baac4435656ec3e))

# [1.1.0-rc.14](https://github.com/janovix/aml/compare/v1.1.0-rc.13...v1.1.0-rc.14) (2025-12-30)


### Features

* add payment method badge variants and improve date formatting in TransactionDetailsView ([60621fb](https://github.com/janovix/aml/commit/60621fb7d65b50082c65beaa5b1ca4e3da4d2ae0))
* enhance client and transaction components with improved URL handling and new UI features ([b465ca9](https://github.com/janovix/aml/commit/b465ca98727007e5ebc2bb2d354618d1b54004bc))
* implement DataTable component with filtering, sorting, and action capabilities ([1b65991](https://github.com/janovix/aml/commit/1b65991c0eb98511bef08390314194ab054956ed))

# [1.1.0-rc.13](https://github.com/janovix/aml/compare/v1.1.0-rc.12...v1.1.0-rc.13) (2025-12-30)


### Bug Fixes

* update operationDate format to date-only and enhance vehicle validation in transaction forms ([ecdaeef](https://github.com/janovix/aml/commit/ecdaeefbcb5cc627c6665dba3b4e9092c4ef27a4))


### Features

* add new UI components and integrate popover functionality ([b6681d1](https://github.com/janovix/aml/commit/b6681d15e3133200523d9a17b6acf310cab856a3))

# [1.1.0-rc.12](https://github.com/janovix/aml/compare/v1.1.0-rc.11...v1.1.0-rc.12) (2025-12-28)


### Bug Fixes

* ensure client edit submits validate ([2758777](https://github.com/janovix/aml/commit/275877752ee529a533c805eed39d73bf32207abc))


### Features

* enhance ClientEditView with comprehensive client data handling and improved form structure ([b0a40d7](https://github.com/janovix/aml/commit/b0a40d720a5f32f35b9f9e7b35d44c793ba6ca2e))

# [1.1.0-rc.11](https://github.com/janovix/aml/compare/v1.1.0-rc.10...v1.1.0-rc.11) (2025-12-27)


### Features

* enhance KPI cards and transaction forms with new stats fetching and brand field updates ([19920c9](https://github.com/janovix/aml/commit/19920c95c5f7de38d1d425a0cf0084eb06305e3d))

# [1.1.0-rc.10](https://github.com/janovix/aml/compare/v1.1.0-rc.9...v1.1.0-rc.10) (2025-12-27)


### Features

* Add LabelWithInfo component and field descriptions ([52ccc35](https://github.com/janovix/aml/commit/52ccc35b202fdcab92993291f9d61108e9245748))
* Add settings page and refactor transaction forms ([d39b4ea](https://github.com/janovix/aml/commit/d39b4ea4990f323d450c20e4dae4f5a18ceae64b))
* Implement Combobox positioning and portal rendering ([37c2492](https://github.com/janovix/aml/commit/37c2492986b6e28ec4cb874a59a9cec28720e040))
* Implement infinite scroll for catalog search ([5b6ae22](https://github.com/janovix/aml/commit/5b6ae22700e6369cc0ea11bf45e6acac177ea603))
* Improve catalog selector search and reset logic ([37383b2](https://github.com/janovix/aml/commit/37383b2aed2e1e0ab590d6a0a4545dbe150d7abd))

# [1.1.0-rc.9](https://github.com/janovix/aml/compare/v1.1.0-rc.8...v1.1.0-rc.9) (2025-12-19)


### Bug Fixes

* **auth:** validate session in middleware instead of just checking cookie ([d9e47eb](https://github.com/janovix/aml/commit/d9e47eb4511f97ad819307f97059fb9aad0c659b))

# [1.1.0-rc.8](https://github.com/janovix/aml/compare/v1.1.0-rc.7...v1.1.0-rc.8) (2025-12-19)


### Features

* **auth:** add JWT token support for API authentication ([e616ec6](https://github.com/janovix/aml/commit/e616ec69b25ec4c4597bf657a57af0586121d877))

# [1.1.0-rc.7](https://github.com/janovix/aml/compare/v1.1.0-rc.6...v1.1.0-rc.7) (2025-12-19)


### Bug Fixes

* adjusted list for clients and transactions ([9b27ea8](https://github.com/janovix/aml/commit/9b27ea83b5e1ce749f5719a0b0c833b0ef703662))
* dropdown spaces removed ([f6ebe5c](https://github.com/janovix/aml/commit/f6ebe5cb819b38d6ca683d6db648e6d16ecf4843))
* smooth style for clients and transactions view ([8717ad7](https://github.com/janovix/aml/commit/8717ad75b2a40ee1cfefae1cf16b40f3ba916b22))
* styles still looking awful ([5221a4c](https://github.com/janovix/aml/commit/5221a4c156e76f81780153219acd17b32f92894a))

# [1.1.0-rc.6](https://github.com/janovix/aml/compare/v1.1.0-rc.5...v1.1.0-rc.6) (2025-12-18)


### Bug Fixes

* change incorporationDate input to date-only for moral person ([330ebd2](https://github.com/janovix/aml/commit/330ebd22a884a1ab17a6605511f2d9ffa7d0d6b5))
* use consistent API base URL for catalog endpoints ([7fcbd88](https://github.com/janovix/aml/commit/7fcbd88358ae287034da926a4b0b6502a5c87dff))


### Features

* add validation to prevent payment methods sum exceeding transaction amount ([6ae6f8e](https://github.com/janovix/aml/commit/6ae6f8e276dbec288f5c9fd32463346deaafd831))
* integrate transactions API and remove mock data ([377e80c](https://github.com/janovix/aml/commit/377e80cca14b5a9b4ebecc5adddda2f278c488b6))
* replace client dropdown with ClientSelector in transaction creation ([63a6d22](https://github.com/janovix/aml/commit/63a6d22d4389b669e590ce313aa4f0c823059c2e))
* update transactions to support multiple payment methods and remove serialNumber ([d871748](https://github.com/janovix/aml/commit/d8717480de630717f53b76efe8cea96bb2fa213c))

# [1.1.0-rc.5](https://github.com/janovix/aml/compare/v1.1.0-rc.4...v1.1.0-rc.5) (2025-12-18)


### Features

* Add transaction and client document/address APIs ([6e70bd4](https://github.com/janovix/aml/commit/6e70bd49c6b7414110de49870d7214b5880084bd))

# [1.1.0-rc.4](https://github.com/janovix/aml/compare/v1.1.0-rc.3...v1.1.0-rc.4) (2025-12-18)


### Bug Fixes

* **auth:** use onSuccess callback in signOut to control redirect ([6dcdc9e](https://github.com/janovix/aml/commit/6dcdc9e4a328a6925f69031215237ffc87ebee0a))

# [1.1.0-rc.3](https://github.com/janovix/aml/compare/v1.1.0-rc.2...v1.1.0-rc.3) (2025-12-18)


### Features

* Add auth session and logout to navbar ([01bf8de](https://github.com/janovix/aml/commit/01bf8def33d3f56f7cb788776e410e783e8b78b7))
* Add authentication using better-auth and nanostores ([61521fa](https://github.com/janovix/aml/commit/61521fa26aa9367a9fb9263ee17815c07a64ae62))

# [1.1.0-rc.2](https://github.com/janovix/aml/compare/v1.1.0-rc.1...v1.1.0-rc.2) (2025-12-18)


### Bug Fixes

* replace hardcoded URL with example fallback URL ([a533441](https://github.com/janovix/aml/commit/a53344118494579ee528b3da941dc74503404b0e))

# [1.1.0-rc.1](https://github.com/janovix/aml/compare/v1.0.0...v1.1.0-rc.1) (2025-12-17)


### Features

* Specify pnpm as package manager ([d2662aa](https://github.com/janovix/aml/commit/d2662aaf96376dfd372ec247ce35bcfeb4baef44))

# 1.0.0 (2025-12-16)


### Features

* Add client and transaction detail pages and forms ([fbaf5f5](https://github.com/janovix/aml/commit/fbaf5f5d367946e8ad1afb3451d993a8c7b64d1d))
* Add clients page and UI components ([ddde4c4](https://github.com/janovix/aml/commit/ddde4c49a8c3f99e96141094ed82621d57461be0))
* Add comprehensive testing and configuration updates ([25f716d](https://github.com/janovix/aml/commit/25f716d9abb67154da27e4fbb84c92bd67ae64dc))
* Add tests for client and transaction pages ([d04562e](https://github.com/janovix/aml/commit/d04562e1e3880f48bea95d1ddfec60e79c612496))
* Add tests for transactions components and types ([ba8b01d](https://github.com/janovix/aml/commit/ba8b01d727aeb21616efdd0b0b53e1d1c9e96e17))
* Add transactions page with table and filters ([008b5bd](https://github.com/janovix/aml/commit/008b5bd899158fdbedba8e093a858ca9bac0f132))

# 1.0.0 (2025-12-14)


### Bug Fixes

* adding cf build script ([e4304da](https://github.com/algtools/next-template/commit/e4304dae686a6cabe53f20a6a88d73f6d6d1dbbe))
* update CI workflow to skip Chromatic publishing on 'dev' branch ([17b1390](https://github.com/algtools/next-template/commit/17b1390591887196d224e5b7e6f214b824b93372))


### Features

* Add core functionality ([1cfb1d8](https://github.com/algtools/next-template/commit/1cfb1d8bb6bd41aa3e7d2808b143d41c56d183dd))
* add TodoApp component with local storage support and UI enhancements ([dd9a9e6](https://github.com/algtools/next-template/commit/dd9a9e68c5bccca24531aa595efd47143bc59ba4))
* integrate storybook ([72c57c8](https://github.com/algtools/next-template/commit/72c57c8bc2114ba1bfa9e993f479edf5198ec87c))
* Integrate SWR for data fetching and update TodoApp ([ee15a61](https://github.com/algtools/next-template/commit/ee15a6143cea5dacef562c97ee6ed7cd8f7241e6))

# [1.0.0-rc.4](https://github.com/algtools/next-template/compare/v1.0.0-rc.3...v1.0.0-rc.4) (2025-12-14)


### Features

* Add core functionality ([1cfb1d8](https://github.com/algtools/next-template/commit/1cfb1d8bb6bd41aa3e7d2808b143d41c56d183dd))

# [1.0.0-rc.3](https://github.com/algtools/next-template/compare/v1.0.0-rc.2...v1.0.0-rc.3) (2025-12-13)


### Bug Fixes

* update CI workflow to skip Chromatic publishing on 'dev' branch ([17b1390](https://github.com/algtools/next-template/commit/17b1390591887196d224e5b7e6f214b824b93372))

# [1.0.0-rc.2](https://github.com/algtools/next-template/compare/v1.0.0-rc.1...v1.0.0-rc.2) (2025-12-13)


### Features

* integrate storybook ([72c57c8](https://github.com/algtools/next-template/commit/72c57c8bc2114ba1bfa9e993f479edf5198ec87c))

# 1.0.0-rc.1 (2025-12-13)


### Bug Fixes

* adding cf build script ([e4304da](https://github.com/algtools/next-template/commit/e4304dae686a6cabe53f20a6a88d73f6d6d1dbbe))


### Features

* add TodoApp component with local storage support and UI enhancements ([dd9a9e6](https://github.com/algtools/next-template/commit/dd9a9e68c5bccca24531aa595efd47143bc59ba4))
* Integrate SWR for data fetching and update TodoApp ([ee15a61](https://github.com/algtools/next-template/commit/ee15a6143cea5dacef562c97ee6ed7cd8f7241e6))

# Changelog

All notable changes to this project will be documented in this file.
