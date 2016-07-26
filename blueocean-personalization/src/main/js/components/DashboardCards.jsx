/**
 * Created by cmeyers on 7/6/16.
 */
import React, { Component, PropTypes } from 'react';
import { observer } from 'mobx-react';

import { List } from 'immutable';

import FavoritesProvider from './FavoritesProvider';
import { PipelineCard } from './PipelineCard';

// the order the cards should be displayed based on their result/state (aka 'status')
const statusSortOrder = [
    'UNKNOWN', 'FAILURE', 'ABORTED', 'NOT_BUILT',
    'UNSTABLE', 'RUNNING', 'QUEUED', 'SUCCESS',
];

const extractStatus = (favorite) => {
    const latestRun = favorite && favorite.item && favorite.item.latestRun || {};
    return latestRun.result === 'UNKNOWN' ? latestRun.state : latestRun.result;
};

// sorts the cards based on 1. status 2. endTime, startTime or enQueueTime (descending)
const sortComparator = (favoriteA, favoriteB) => {
    const statusA = extractStatus(favoriteA);
    const statusB = extractStatus(favoriteB);
    const orderA = statusSortOrder.indexOf(statusA);
    const orderB = statusSortOrder.indexOf(statusB);

    if (orderA < orderB) {
        return -1;
    } else if (orderA > orderB) {
        return 1;
    }

    const endTimeA = favoriteA && favoriteA.item && favoriteA.item.latestRun && favoriteA.item.latestRun.endTime;
    const endTimeB = favoriteB && favoriteB.item && favoriteB.item.latestRun && favoriteB.item.latestRun.endTime;

    if (endTimeA && endTimeB) {
        const endCompare = endTimeA.localeCompare(endTimeB);

        if (endCompare !== 0) {
            return -endCompare;
        }
    }

    const startTimeA = favoriteA && favoriteA.item && favoriteA.item.latestRun && favoriteA.item.latestRun.startTime;
    const startTimeB = favoriteB && favoriteB.item && favoriteB.item.latestRun && favoriteB.item.latestRun.startTime;

    if (startTimeA && startTimeB) {
        const startCompare = startTimeA.localeCompare(startTimeB);

        if (startCompare !== 0) {
            return -startCompare;
        }
    }

    const queuedTimeA = favoriteA && favoriteA.item && favoriteA.item.latestRun && favoriteA.item.latestRun.enQueueTime;
    const queuedTimeB = favoriteB && favoriteB.item && favoriteB.item.latestRun && favoriteB.item.latestRun.enQueueTime;

    if (queuedTimeA && queuedTimeB) {
        const queueCompare = queuedTimeA.localeCompare(queuedTimeB);

        if (queueCompare !== 0) {
            return -queueCompare;
        }
    }

    return 0;
};

/**
 * Extract elements from a path string deliminted with forward slashes
 * @param path
 * @param begin
 * @param end
 * @returns {string}
 */
const extractPath = (path, begin, end) => {
    try {
        return path.split('/').slice(begin, end).join('/');
    } catch (error) {
        return path;
    }
};

/**
 */
@observer
export class DashboardCards extends Component {

    _onFavoriteToggle(isFavorite, favorite) {
        this.props.favoritesList.toggleFavorite(isFavorite, favorite.item);
    }

    _renderCardStack() {
        if (!this.props.favoritesList.favorites) {
            return null;
        }

        const sortedFavorites = this.props.favoritesList.favorites.sort(sortComparator);

        const favoriteCards = sortedFavorites.map(favorite => {
            const pipeline = favorite.item;
            const latestRun = pipeline.latestRun;

            let fullName;
            let pipelineName;
            let branchName;

            if (pipeline._class === 'io.jenkins.blueocean.service.embedded.rest.BranchImpl') {
                // branch.fullName is in the form folder1/folder2/pipeline/branch ...
                // "pipeline"
                pipelineName = extractPath(pipeline.fullName, -2, -1);
                // everything up to "branch"
                fullName = extractPath(pipeline.fullName, 0, -1);
                branchName = pipeline.name;
            } else {
                pipelineName = pipeline.name;
                fullName = pipeline.fullName;
            }

            let status = null;
            let startTime = null;
            let estimatedDuration = null;
            let commitId = null;

            if (latestRun) {
                if (latestRun.result) {
                    status = latestRun.result === 'UNKNOWN' ? latestRun.state : latestRun.result;
                }

                startTime = latestRun.startTime;
                estimatedDuration = latestRun.estimatedDurationInMillis;
                commitId = latestRun.commitId;
            }

            if (latestRun && latestRun.result) {
                status = latestRun.result === 'UNKNOWN' ? latestRun.state : latestRun.result;
            }

            return (
                <div key={favorite._links.self.href}>
                    <PipelineCard
                      status={status}
                      startTime={startTime}
                      estimatedDuration={estimatedDuration}
                      fullName={fullName}
                      organization={pipeline.organization}
                      pipeline={pipelineName}
                      branch={branchName}
                      commitId={commitId}
                      favorite
                      onFavoriteToggle={(isFavorite) => this._onFavoriteToggle(isFavorite, favorite)}
                    />
                </div>
            );
        });

        return (
            <div className="favorites-card-stack">
                {favoriteCards}
            </div>
        );
    }

    render() {
        return (
            <div>
                { this._renderCardStack() }
            </div>
        );
    }
}

DashboardCards.propTypes = {
    favoritesList: PropTypes.object,
};

export default DashboardCards;
