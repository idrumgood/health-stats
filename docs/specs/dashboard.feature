Feature: Dashboard Data Visualization
  As a user
  I want to view a visual representation of my synced health and fitness data
  So that I can easily understand my recent trends and metrics

  Scenario: Viewing the dashboard with synced data
    Given I have successfully synced my data from Strava and Whoop
    When I navigate to the Dashboard page
    Then the system retrieves the latest 50 records of Strava activities and Whoop cycles from the local database
    And the page displays a chart visualizing my Whoop Strain and Recovery scores over the last 14 days

  Scenario: Viewing the dashboard with no data
    Given the local database contains no Strava or Whoop data
    When I navigate to the Dashboard page
    Then the page indicates that there is no data to display or displays empty charts
