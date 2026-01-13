# Documentation for server/openai/survey-menu-validator.ts

Survey validation metadata for all question types
/
Menu-specific metadata
Rating-specific metadata

 Enhanced survey validation result
/

 Enhanced validate survey requirements with detailed format checking for all question types
/
Only validate questions that require specific bubble types (menu, multiselect_menu, rating)
Build validation metadata based on question type
1. Check if required bubble exists
2. Validate the bubble format

 Determine expected menu type based on question type
/

 Validate individual menu bubble format against expectations
/
1. Check message type matches expectation
2. Check options exist and are properly formatted
3. Check option count matches expectation
4. Validate each option has required fields
5. Check if option texts match expected texts (fuzzy match for localization)
6. For multiselect menus, validate multiselect-specific properties

 Check if question requires validation
/

 Build validation metadata for any question type
/

 Get description of question for error messages
/

 Validate bubble format against expectations (menu, multiselect_menu, or rating)
/
1. Check message type matches expectation
2. Type-specific validation

 Validate menu and multiselect_menu bubbles
/
Check options exist and are properly formatted
Check option count matches expectation
Validate each option has required fields
Check if option texts match expected texts (fuzzy match for localization)
For multiselect menus, validate multiselect-specific properties

 Validate rating bubbles
/
Validate minValue
Validate maxValue
Validate ratingType
Validate step (optional but should be number if present)
Validate value range makes sense
Legacy type exports for backward compatibility