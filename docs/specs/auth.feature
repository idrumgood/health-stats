Feature: OAuth Connection for Strava and Whoop
  As a user
  I want to connect my Strava and Whoop accounts to the dashboard
  So that I can aggregate my fitness and health data in one place

  Scenario: User connects Strava successfully
    Given I am on the Setup page
    And my Strava account is currently disconnected
    When I click the "Connect Strava" button
    Then I am redirected to the Strava OAuth authorization page
    When I authorize the application and am redirected back to the callback URL
    Then the system exchanges the authorization code for an access token
    And the system securely stores the Strava access token and refresh token in the local database
    And the Setup page updates my Strava status to "Connected"

  Scenario: User connects Whoop successfully
    Given I am on the Setup page
    And my Whoop account is currently disconnected
    When I click the "Connect Whoop" button
    Then I am redirected to the Whoop OAuth authorization page with a secure state parameter
    When I authorize the application and am redirected back to the callback URL
    Then the system exchanges the authorization code for an access token
    And the system securely stores the Whoop access token and refresh token in the local database
    And the Setup page updates my Whoop status to "Connected"

  Scenario: Viewing connection status on page load
    Given I have previously connected both Strava and Whoop
    When I navigate to the Setup page
    Then the system checks the local database for existing, valid tokens
    And the Setup page displays "Connected" for both Strava and Whoop
