import includes from 'lodash/includes';
import isNumber from 'lodash/isNumber';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Space from 'app/components/Space';
import Widget from 'app/components/Widget';
import controller from 'app/lib/controller';
import ensurePositiveNumber from 'app/lib/ensure-positive-number';
import i18n from 'app/lib/i18n';
import WidgetConfig from '../WidgetConfig';
import Test01 from './Test01';
import {
  // Grbl
  GRBL,
  // Marlin
  MARLIN,
  // Smoothie
  SMOOTHIE,
  // TinyG
  TINYG
} from '../../constants';
import styles from './index.styl';

class Test01Widget extends PureComponent {
    static propTypes = {
      widgetId: PropTypes.string.isRequired,
      onFork: PropTypes.func.isRequired,
      onRemove: PropTypes.func.isRequired,
      sortable: PropTypes.object
    };

    // Public methods
    collapse = () => {
      this.setState({ minimized: true });
    };

    expand = () => {
      this.setState({ minimized: false });
    };

    config = new WidgetConfig(this.props.widgetId);

    state = this.getInitialState();

    actions = {
      toggleFullscreen: () => {
        const { minimized, isFullscreen } = this.state;
        this.setState({
          minimized: isFullscreen ? minimized : false,
          isFullscreen: !isFullscreen
        });
      },
      toggleMinimized: () => {
        const { minimized } = this.state;
        this.setState({ minimized: !minimized });
      },
      toggleTest01Test: () => {
        const expanded = this.state.panel.test01Test.expanded;

        this.setState({
          panel: {
            ...this.state.panel,
            test01Test: {
              ...this.state.panel.test01Test,
              expanded: !expanded
            }
          }
        });
      },
      changeTest01TestPower: (value) => {
        const power = Number(value) || 0;
        this.setState({
          test: {
            ...this.state.test,
            power
          }
        });
      },
      changeTest01TestDuration: (event) => {
        const value = event.target.value;
        if (typeof value === 'string' && value.trim() === '') {
          this.setState({
            test: {
              ...this.state.test,
              duration: ''
            }
          });
        } else {
          this.setState({
            test: {
              ...this.state.test,
              duration: ensurePositiveNumber(value)
            }
          });
        }
      },
      changeTest01TestMaxS: (event) => {
        const value = event.target.value;
        if (typeof value === 'string' && value.trim() === '') {
          this.setState({
            test: {
              ...this.state.test,
              maxS: ''
            }
          });
        } else {
          this.setState({
            test: {
              ...this.state.test,
              maxS: ensurePositiveNumber(value)
            }
          });
        }
      },
      test01TestOn: () => {
        const { power, duration, maxS } = this.state.test;
        controller.command('test01test:on', power, duration, maxS);
      },
      test01TestOff: () => {
        controller.command('test01test:off');
      }
    };

    controllerEvents = {
      'serialport:open': (options) => {
        const { port } = options;
        this.setState({ port: port });
      },
      'serialport:close': (options) => {
        const initialState = this.getInitialState();
        this.setState({ ...initialState });
      },
      'controller:settings': (type, controllerSettings) => {
        this.setState(state => ({
          controller: {
            ...state.controller,
            type: type,
            settings: controllerSettings
          }
        }));
      },
      'controller:state': (type, controllerState) => {
        this.setState(state => ({
          controller: {
            ...state.controller,
            type: type,
            state: controllerState
          }
        }));
      }
    };

    componentDidMount() {
      this.addControllerEvents();
    }

    componentWillUnmount() {
      this.removeControllerEvents();
    }

    componentDidUpdate(prevProps, prevState) {
      const {
        minimized,
        panel,
        test
      } = this.state;

      this.config.set('minimized', minimized);
      this.config.set('panel.test01Test.expanded', panel.test01Test.expanded);
      if (isNumber(test.power)) {
        this.config.set('test.power', test.power);
      }
      if (isNumber(test.duration)) {
        this.config.set('test.duration', test.duration);
      }
      if (isNumber(test.maxS)) {
        this.config.set('test.maxS', test.maxS);
      }
    }

    getInitialState() {
      return {
        minimized: this.config.get('minimized', false),
        isFullscreen: false,
        canClick: true, // Defaults to true
        port: controller.port,
        controller: {
          type: controller.type,
          settings: controller.settings,
          state: controller.state
        },
        panel: {
          test01Test: {
            expanded: this.config.get('panel.test01Test.expanded')
          }
        },
        test: {
          power: this.config.get('test.power', 0),
          duration: this.config.get('test.duration', 0),
          maxS: this.config.get('test.maxS', 1000)
        }
      };
    }

    addControllerEvents() {
      Object.keys(this.controllerEvents).forEach(eventName => {
        const callback = this.controllerEvents[eventName];
        controller.addListener(eventName, callback);
      });
    }

    removeControllerEvents() {
      Object.keys(this.controllerEvents).forEach(eventName => {
        const callback = this.controllerEvents[eventName];
        controller.removeListener(eventName, callback);
      });
    }

    canClick() {
      const { port, controller, test } = this.state;
      const controllerType = controller.type;

      if (!port) {
        return false;
      }
      if (!includes([GRBL, MARLIN, SMOOTHIE, TINYG], controllerType)) {
        return false;
      }
      if (!(isNumber(test.power) && isNumber(test.duration) && isNumber(test.maxS))) {
        return false;
      }

      return true;
    }

    render() {
      const { widgetId } = this.props;
      const { minimized, isFullscreen } = this.state;
      const isForkedWidget = widgetId.match(/\w+:[\w\-]+/);
      const state = {
        ...this.state,
        canClick: this.canClick()
      };
      const actions = {
        ...this.actions
      };

      return (
        <Widget fullscreen={isFullscreen}>
          <Widget.Header>
            <Widget.Title>
              <Widget.Sortable className={this.props.sortable.handleClassName}>
                <i className="fa fa-bars" />
                <Space width="8" />
              </Widget.Sortable>
              {isForkedWidget &&
                <i className="fa fa-code-fork" style={{ marginRight: 5 }} />
              }
              {i18n._('Test01')}
            </Widget.Title>
            <Widget.Controls className={this.props.sortable.filterClassName}>
              <Widget.Button
                disabled={isFullscreen}
                title={minimized ? i18n._('Expand') : i18n._('Collapse')}
                onClick={actions.toggleMinimized}
              >
                <i
                  className={classNames(
                    'fa',
                    { 'fa-chevron-up': !minimized },
                    { 'fa-chevron-down': minimized }
                  )}
                />
              </Widget.Button>
              <Widget.DropdownButton
                title={i18n._('More')}
                toggle={<i className="fa fa-ellipsis-v" />}
                onSelect={(eventKey) => {
                  if (eventKey === 'fullscreen') {
                    actions.toggleFullscreen();
                  } else if (eventKey === 'fork') {
                    this.props.onFork();
                  } else if (eventKey === 'remove') {
                    this.props.onRemove();
                  }
                }}
              >
                <Widget.DropdownMenuItem eventKey="fullscreen">
                  <i
                    className={classNames(
                      'fa',
                      'fa-fw',
                      { 'fa-expand': !isFullscreen },
                      { 'fa-compress': isFullscreen }
                    )}
                  />
                  <Space width="4" />
                  {!isFullscreen ? i18n._('Enter Full Screen') : i18n._('Exit Full Screen')}
                </Widget.DropdownMenuItem>
                <Widget.DropdownMenuItem eventKey="fork">
                  <i className="fa fa-fw fa-code-fork" />
                  <Space width="4" />
                  {i18n._('Fork Widget')}
                </Widget.DropdownMenuItem>
                <Widget.DropdownMenuItem eventKey="remove">
                  <i className="fa fa-fw fa-times" />
                  <Space width="4" />
                  {i18n._('Remove Widget')}
                </Widget.DropdownMenuItem>
              </Widget.DropdownButton>
            </Widget.Controls>
          </Widget.Header>
          <Widget.Content
            className={classNames(
              styles.widgetContent,
              { [styles.hidden]: minimized }
            )}
          >
            <Test01
              state={state}
              actions={actions}
            />
          </Widget.Content>
        </Widget>
      );
    }
}

export default Test01Widget;
