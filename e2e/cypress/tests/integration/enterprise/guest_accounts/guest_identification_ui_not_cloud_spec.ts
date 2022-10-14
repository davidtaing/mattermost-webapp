// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. #. Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element ID when selecting an element. Create one if none.
// ***************************************************************

// Stage: @prod
// Group: @enterprise @guest_account @not_cloud

import {Channel} from '@mattermost/types/lib/channels';
import {UserProfile} from '@mattermost/types/lib/users';

import * as TIMEOUTS from '../../../fixtures/timeouts';

describe('Verify Guest User Identification in different screens', () => {
    let guest: UserProfile;
    let testChannel: Channel;

    before(() => {
        cy.shouldNotRunOnCloudEdition();

        // * Check if server has license for Guest Accounts
        cy.apiRequireLicenseForFeature('GuestAccounts');

        // # Enable GuestAccountSettings
        cy.apiUpdateConfig({
            GuestAccountsSettings: {
                Enable: true,
            },
            ServiceSettings: {
                EnableEmailInvitations: true,
            },
        });

        cy.apiInitSetup().then(({team, channel, user}) => {
            testChannel = channel;

            cy.apiCreateGuestUser().then((guestUser) => {
                guest = guestUser;
                cy.apiAddUserToTeam(team.id, guest.id).then(() => {
                    cy.apiAddUserToChannel(channel.id, guest.id);
                });
            });

            // # Login as regular user and visit the channel with guest
            cy.apiLogin(user);
            cy.visit(`/${team.name}/channels/${channel.name}`);
        });
    });

    it('MM-T1419 Deactivating a Guest removes "This channel has guests" message from channel header', () => {
        // * Verify the text 'This channel has guests' is displayed in the header
        cy.get('#channelHeaderDescription').within(($el) => {
            cy.wrap($el).find('.has-guest-header').should('be.visible').and('have.text', 'This channel has guests');
        });

        // # Deactivate Guest user
        cy.externalActivateUser(guest.id, false).wait(TIMEOUTS.FIVE_SEC);

        // # Switch channels away and back to reload the header
        cy.get('.SidebarChannel:contains(Town Square)').click();
        cy.get(`.SidebarChannel:contains(${testChannel.display_name})`).click();

        // * Verify the text 'This channel has guests' is removed from the header
        cy.get('#channelHeaderDescription').within(($el) => {
            cy.wrap($el).find('.has-guest-header').should('not.exist');
        });
    });
});
