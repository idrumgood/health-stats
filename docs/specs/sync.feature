Feature: Data Synchronization from External Services
  As a user
  I want to sync my latest activity and recovery data from connected services
  So that my dashboard is up-to-date with my recent health metrics

  Scenario: Syncing data when both services are connected
    Given I have connected both Strava and Whoop
    And I am on the Setup page
    When I click the "Sync Now" button
    Then the system fetches my latest activities from the Strava API
    And the system fetches my last 30 days of cycle, sleep, and recovery data from the Whoop API
    And the system updates the local database with the newly fetched data
    And the UI indicates that the synchronization is complete

  Scenario: Automatically refreshing expired tokens during sync
    Given I have connected a service (Strava or Whoop)
    And my access token for that service has expired
    When the system attempts to sync data from that service
    Then the system automatically uses the stored refresh token to obtain a new access token
    And the system stores the new access token in the local database
    And the synchronization proceeds successfully using the new access token

  Scenario: Syncing with only one service connected
    Given I have connected only Strava
    And my Whoop account is disconnected
    When I click the "Sync Now" button
    Then the system fetches and stores my latest activities from the Strava API
    And the system skips the Whoop synchronization process
    And the UI indicates that the synchronization is complete without errors
