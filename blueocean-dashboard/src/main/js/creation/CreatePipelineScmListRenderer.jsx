/**
 * Created by cmeyers on 10/17/16.
 */
import React, { PropTypes } from 'react';
import Extensions from '@jenkins-cd/js-extensions';

const Sandbox = Extensions.SandboxedComponent;

export class CreatePipelineScmListRenderer extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            providers: [],
        };
    }

    componentWillMount() {
        this._initialize();
    }

    _initialize() {
        Extensions.store.getExtensions(this.props.extensionPoint, (extensions) => {
            let providers = extensions.map(Provider => {
                try {
                    return new Provider();
                } catch (error) {
                    console.warn('error initializing ScmProvider', Provider, error);
                    return null;
                }
            });

            providers = providers.filter(provider => {
                return !!provider;
            });

            this.setState({
                providers,
            });
        });
    }

    _onSelection(provider) {
        if (this.props.onSelection) {
            this.props.onSelection(provider);
        }
    }

    render() {
        return (
            <div className="scm-provider-list">
                { this.state.providers.map(provider => {
                    let defaultOption;

                    try {
                        defaultOption = provider.getDefaultOption();
                    } catch (error) {
                        console.warn('error invoking getDefaultOption for Provider', provider, error);
                        return Extensions.ErrorUtils.errorToElement(error);
                    }

                    const props = {
                        onSelect: () => this._onSelection(provider),
                    };

                    return (
                        <Sandbox>
                            {React.cloneElement(defaultOption, props)}
                        </Sandbox>
                    );
                })}
            </div>
        );
    }
}

CreatePipelineScmListRenderer.propTypes = {
    extensionPoint: PropTypes.string,
    onSelection: PropTypes.func,
};